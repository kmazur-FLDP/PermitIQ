"""
PermitIQ - Environmental Resource Permit ETL Pipeline
Fetches permit data from SWFWMD ArcGIS API and loads into Supabase

Author: Kevin Mazur
Created: 2025-10-22
"""

import os
import sys
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("PERMITIQ_LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class SWFWMDAPIClient:
    """
    Client for interacting with Southwest Florida Water Management District ArcGIS API
    
    API Constraints:
    - Available 6 AM - 10 PM EST only
    - Max 1,000 records per request (requires pagination)
    - Returns GeoJSON format
    """
    
    def __init__(self, base_url: str):
        """
        Initialize the API client
        
        Args:
            base_url: Base URL for the SWFWMD ArcGIS REST API endpoint
        """
        self.base_url = base_url.rstrip('/')
        self.session = self._create_session()
        
    def _create_session(self) -> requests.Session:
        """
        Create a requests session with retry logic
        
        Returns:
            Configured requests Session
        """
        session = requests.Session()
        
        # Retry strategy for transient failures
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def get_record_count(self) -> int:
        """
        Get total count of records available in the API
        
        Returns:
            Total number of records
        """
        params = {
            'where': '1=1',
            'returnCountOnly': 'true',
            'f': 'json'
        }
        
        url = f"{self.base_url}/query"
        
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            count = data.get('count', 0)
            logger.info(f"Total records available: {count:,}")
            return count
        except Exception as e:
            logger.error(f"Failed to get record count: {e}")
            raise
    
    def fetch_permits(
        self, 
        offset: int = 0, 
        limit: int = 1000,
        where_clause: str = "1=1"
    ) -> List[Dict[str, Any]]:
        """
        Fetch permit records from the API with pagination
        
        Args:
            offset: Record offset for pagination
            limit: Maximum records per request (API max is 1000)
            where_clause: SQL WHERE clause for filtering
        
        Returns:
            List of permit records as dictionaries
        """
        params = {
            'where': where_clause,
            'outFields': '*',  # Get all fields
            'returnGeometry': 'true',
            'outSR': '4326',  # WGS84 coordinate system (lat/lng)
            'f': 'json',
            'resultOffset': offset,
            'resultRecordCount': min(limit, 1000)  # API max
        }
        
        url = f"{self.base_url}/query"
        
        try:
            logger.debug(f"Fetching records at offset {offset}")
            response = self.session.get(url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            
            if 'error' in data:
                raise ValueError(f"API Error: {data['error']}")
            
            features = data.get('features', [])
            logger.info(f"Fetched {len(features)} records (offset: {offset})")
            
            return features
            
        except Exception as e:
            logger.error(f"Failed to fetch permits at offset {offset}: {e}")
            raise
    
    def fetch_all_permits(self, batch_size: int = 1000) -> List[Dict[str, Any]]:
        """
        Fetch all permit records using pagination
        
        Args:
            batch_size: Records per batch (max 1000 due to API limit)
        
        Returns:
            List of all permit records
        """
        all_permits = []
        offset = 0
        total_count = self.get_record_count()
        
        logger.info(f"Starting full data fetch ({total_count:,} total records)")
        
        while offset < total_count:
            batch = self.fetch_permits(offset=offset, limit=batch_size)
            
            if not batch:
                logger.warning(f"No records returned at offset {offset}, stopping")
                break
            
            all_permits.extend(batch)
            offset += len(batch)
            
            # Progress indicator
            progress = (len(all_permits) / total_count) * 100
            logger.info(f"Progress: {len(all_permits):,}/{total_count:,} ({progress:.1f}%)")
        
        logger.info(f"Fetch complete: {len(all_permits):,} records retrieved")
        return all_permits


class PermitIQETL:
    """
    Main ETL pipeline for PermitIQ
    
    Responsibilities:
    - Fetch data from SWFWMD API
    - Transform and normalize data
    - Detect changes vs existing database
    - Load data into Supabase
    - Calculate statistics and hotspots
    """
    
    def __init__(self, supabase_url: str, supabase_key: str, api_url: str):
        """
        Initialize the ETL pipeline
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
            api_url: SWFWMD API endpoint URL
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.api_client = SWFWMDAPIClient(api_url)
        self.etl_run_id = uuid.uuid4()
        self.dry_run = os.getenv("PERMITIQ_DRY_RUN", "false").lower() == "true"
        
        logger.info(f"ETL Run ID: {self.etl_run_id}")
        if self.dry_run:
            logger.warning("DRY RUN MODE - No data will be written to database")
    
    def transform_permit(self, feature: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw API response into database-ready format
        
        Args:
            feature: Raw feature from ArcGIS API
        
        Returns:
            Transformed permit dictionary
        """
        attributes = feature.get('attributes', {})
        geometry = feature.get('geometry', {})
        
        # Handle polygon geometry from SWFWMD API
        # Permits have project boundaries (polygons), not just points
        polygon_wkt = None
        centroid_wkt = None
        latitude = None
        longitude = None
        
        if geometry and 'rings' in geometry:
            rings = geometry['rings']
            if rings and len(rings) > 0:
                # Build WKT POLYGON from rings
                # Format: POLYGON((x1 y1, x2 y2, x3 y3, x1 y1))
                ring_strs = []
                for ring in rings:
                    coords = [f"{lon} {lat}" for lon, lat in ring]
                    ring_strs.append(f"({', '.join(coords)})")
                polygon_wkt = f"POLYGON({', '.join(ring_strs)})"
                
                # Calculate centroid for point-based queries (average of first ring coordinates)
                first_ring = rings[0]
                if first_ring:
                    avg_lon = sum(coord[0] for coord in first_ring) / len(first_ring)
                    avg_lat = sum(coord[1] for coord in first_ring) / len(first_ring)
                    longitude = avg_lon
                    latitude = avg_lat
                    centroid_wkt = f"POINT({avg_lon} {avg_lat})"
        
        # Transform to database schema
        # Field names based on actual API discovery (see docs/planning/api_field_discovery.json)
        permit = {
            'objectid': attributes.get('OBJECTID'),
            'permit_number': str(attributes.get('ERP_PERMIT_NBR')) if attributes.get('ERP_PERMIT_NBR') else None,
            'applicant_name': attributes.get('PERMITTEE_NAME'),
            'company_name': attributes.get('PERMITTEE_NAME'),  # API doesn't separate company name
            'permit_type': attributes.get('ERP_PERMIT_TYPE_DESC'),
            'permit_status': attributes.get('ERP_STATUS_DESC'),
            'activity_description': attributes.get('ERP_ACTIVITY_DESC'),
            'application_date': self._parse_timestamp(attributes.get('APPLICATION_RECEIVED_DT')),
            'issue_date': self._parse_timestamp(attributes.get('PERMIT_ISSUE_DT')),
            'expiration_date': self._parse_timestamp(attributes.get('EXPIRATION_DT')),
            'last_modified_date': self._parse_timestamp(attributes.get('LAST_UPDATE_DT')),
            'county': None,  # Not available in API
            'city': None,  # Not available in API
            'address': None,  # Not available in API
            'latitude': latitude,
            'longitude': longitude,
            'geometry': polygon_wkt,  # Full project boundary polygon
            'location': centroid_wkt,  # Centroid point for markers/clustering
            'project_name': attributes.get('PROJECT_NAME'),
            'project_type': None,  # Not available in API
            'acreage': attributes.get('PROJECT_ACRES_MS'),
            'raw_data': json.dumps(attributes),  # Store full API response
            'data_source': 'SWFWMD_API'
        }
        
        # Remove None values
        permit = {k: v for k, v in permit.items() if v is not None}
        
        return permit
    
    def _parse_timestamp(self, timestamp: Optional[Any]) -> Optional[str]:
        """
        Parse ArcGIS timestamp (milliseconds since epoch) to ISO format
        
        Args:
            timestamp: Milliseconds since epoch or None
        
        Returns:
            ISO formatted datetime string or None
        """
        if timestamp is None:
            return None
        
        try:
            # ArcGIS uses milliseconds since epoch
            dt = datetime.fromtimestamp(int(timestamp) / 1000)
            return dt.isoformat()
        except (ValueError, TypeError):
            logger.warning(f"Could not parse timestamp: {timestamp}")
            return None
    
    def upsert_permits(self, permits: List[Dict[str, Any]]) -> int:
        """
        Insert or update permits in database
        
        Args:
            permits: List of transformed permit dictionaries
        
        Returns:
            Number of permits processed
        """
        if self.dry_run:
            logger.info(f"DRY RUN: Would upsert {len(permits)} permits")
            return len(permits)
        
        try:
            # Upsert in batches to avoid timeouts
            batch_size = 100
            total_processed = 0
            
            for i in range(0, len(permits), batch_size):
                batch = permits[i:i + batch_size]
                
                # Supabase upsert (insert or update based on unique constraint)
                response = self.supabase.table('erp_permits').upsert(
                    batch,
                    on_conflict='permit_number'
                ).execute()
                
                total_processed += len(batch)
                logger.info(f"Upserted batch: {total_processed}/{len(permits)}")
            
            logger.info(f"Successfully upserted {total_processed} permits")
            return total_processed
            
        except Exception as e:
            logger.error(f"Failed to upsert permits: {e}")
            raise
    
    def run(self):
        """
        Execute the full ETL pipeline
        """
        logger.info("=" * 80)
        logger.info("PERMITIQ ETL PIPELINE STARTED")
        logger.info("=" * 80)
        
        start_time = datetime.now()
        
        try:
            # Step 1: Fetch data from API
            logger.info("Step 1: Fetching data from SWFWMD API")
            raw_permits = self.api_client.fetch_all_permits()
            logger.info(f"Fetched {len(raw_permits):,} raw permit records")
            
            # Step 2: Transform data
            logger.info("Step 2: Transforming permit data")
            transformed_permits = [
                self.transform_permit(feature) 
                for feature in raw_permits
            ]
            logger.info(f"Transformed {len(transformed_permits):,} permits")
            
            # Deduplicate by permit_number (keep latest revision based on objectid)
            seen_permits = {}
            for permit in transformed_permits:
                permit_num = permit.get('permit_number')
                if permit_num:
                    # Keep the one with higher objectid (more recent)
                    if permit_num not in seen_permits or permit.get('objectid', 0) > seen_permits[permit_num].get('objectid', 0):
                        seen_permits[permit_num] = permit
            
            transformed_permits = list(seen_permits.values())
            logger.info(f"After deduplication: {len(transformed_permits):,} unique permits")
            
            # Step 3: Load into database
            logger.info("Step 3: Loading data into Supabase")
            processed_count = self.upsert_permits(transformed_permits)
            
            # Step 4: Calculate statistics (if not dry run)
            if not self.dry_run:
                logger.info("Step 4: Calculating daily statistics")
                # Note: This requires the database functions to be installed
                try:
                    self.supabase.rpc('calculate_daily_statistics').execute()
                    self.supabase.rpc('calculate_hotspot_scores').execute()
                    logger.info("Statistics calculated successfully")
                except Exception as e:
                    logger.warning(f"Statistics calculation failed: {e}")
            
            # Summary
            duration = (datetime.now() - start_time).total_seconds()
            logger.info("=" * 80)
            logger.info("ETL PIPELINE COMPLETED SUCCESSFULLY")
            logger.info(f"Duration: {duration:.1f} seconds")
            logger.info(f"Records processed: {processed_count:,}")
            logger.info(f"ETL Run ID: {self.etl_run_id}")
            logger.info("=" * 80)
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error("ETL PIPELINE FAILED")
            logger.error(f"Error: {e}")
            logger.error("=" * 80)
            raise


def main():
    """
    Main entry point for ETL script
    """
    # Validate environment variables
    required_env_vars = [
        'PERMITIQ_SUPABASE_URL',
        'PERMITIQ_SUPABASE_SERVICE_KEY',
        'PERMITIQ_SWFWMD_API_URL'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please create a .env file based on .env.example")
        sys.exit(1)
    
    # Initialize and run ETL
    etl = PermitIQETL(
        supabase_url=os.getenv('PERMITIQ_SUPABASE_URL'),
        supabase_key=os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY'),
        api_url=os.getenv('PERMITIQ_SWFWMD_API_URL')
    )
    
    etl.run()


if __name__ == '__main__':
    main()
