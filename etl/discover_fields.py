"""
PermitIQ - API Field Discovery Utility
Fetches a sample of permits and documents actual field structure

This script helps understand the actual API response format since
field names may differ from documentation.

Author: Kevin Mazur
Created: 2025-10-22
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Set
from collections import Counter

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def fetch_sample_permits(api_url: str, sample_size: int = 10) -> list:
    """
    Fetch a small sample of permits to analyze field structure
    
    Args:
        api_url: SWFWMD API endpoint
        sample_size: Number of records to fetch
    
    Returns:
        List of sample permit records
    """
    params = {
        'where': '1=1',
        'outFields': '*',
        'returnGeometry': 'true',
        'outSR': '4326',
        'f': 'json',
        'resultRecordCount': sample_size
    }
    
    url = f"{api_url}/query"
    
    try:
        logger.info(f"Fetching {sample_size} sample records from API...")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if 'error' in data:
            raise ValueError(f"API Error: {data['error']}")
        
        features = data.get('features', [])
        logger.info(f"Successfully fetched {len(features)} records")
        
        return features
        
    except Exception as e:
        logger.error(f"Failed to fetch sample permits: {e}")
        raise


def analyze_field_structure(features: list) -> Dict[str, Any]:
    """
    Analyze the field structure of sample permits
    
    Args:
        features: List of permit features from API
    
    Returns:
        Dictionary with field analysis
    """
    all_fields: Set[str] = set()
    field_types: Dict[str, Counter] = {}
    field_samples: Dict[str, list] = {}
    
    for feature in features:
        attributes = feature.get('attributes', {})
        
        for field_name, field_value in attributes.items():
            all_fields.add(field_name)
            
            # Track data types
            if field_name not in field_types:
                field_types[field_name] = Counter()
            field_types[field_name][type(field_value).__name__] += 1
            
            # Collect sample values (first 3 non-null)
            if field_name not in field_samples:
                field_samples[field_name] = []
            if field_value is not None and len(field_samples[field_name]) < 3:
                field_samples[field_name].append(field_value)
    
    return {
        'total_fields': len(all_fields),
        'field_names': sorted(all_fields),
        'field_types': field_types,
        'field_samples': field_samples
    }


def analyze_geometry(features: list) -> Dict[str, Any]:
    """
    Analyze geometry structure
    
    Args:
        features: List of permit features from API
    
    Returns:
        Dictionary with geometry analysis
    """
    geometry_info = {
        'has_geometry': 0,
        'missing_geometry': 0,
        'geometry_type': None,
        'sample_polygons': [],
        'sample_centroids': []
    }
    
    for feature in features:
        geometry = feature.get('geometry')
        
        if geometry and 'rings' in geometry:
            # Polygon geometry (project boundaries)
            geometry_info['has_geometry'] += 1
            geometry_info['geometry_type'] = 'polygon'
            
            if len(geometry_info['sample_polygons']) < 2:
                rings = geometry['rings']
                # Calculate centroid from first ring
                if rings and len(rings[0]) > 0:
                    first_ring = rings[0]
                    avg_lon = sum(coord[0] for coord in first_ring) / len(first_ring)
                    avg_lat = sum(coord[1] for coord in first_ring) / len(first_ring)
                    
                    geometry_info['sample_polygons'].append({
                        'num_rings': len(rings),
                        'num_points': len(first_ring),
                        'first_point': first_ring[0] if first_ring else None
                    })
                    geometry_info['sample_centroids'].append({
                        'longitude': avg_lon,
                        'latitude': avg_lat
                    })
        else:
            geometry_info['missing_geometry'] += 1
    
    return geometry_info


def generate_report(
    field_analysis: Dict[str, Any], 
    geometry_analysis: Dict[str, Any],
    output_file: str = 'api_field_discovery.json'
) -> None:
    """
    Generate a detailed report of API field structure
    
    Args:
        field_analysis: Field structure analysis
        geometry_analysis: Geometry analysis
        output_file: Output filename for JSON report
    """
    report = {
        'discovery_date': datetime.now().isoformat(),
        'summary': {
            'total_fields': field_analysis['total_fields'],
            'records_with_geometry': geometry_analysis['has_geometry'],
            'records_without_geometry': geometry_analysis['missing_geometry']
        },
        'fields': {},
        'geometry': geometry_analysis
    }
    
    # Detailed field information
    for field_name in field_analysis['field_names']:
        types = field_analysis['field_types'][field_name]
        samples = field_analysis['field_samples'][field_name]
        
        report['fields'][field_name] = {
            'data_types': dict(types),
            'primary_type': types.most_common(1)[0][0] if types else 'unknown',
            'sample_values': samples[:3]
        }
    
    # Save to file
    output_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'planning', output_file)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    logger.info(f"Report saved to: {output_path}")
    
    # Print summary to console
    print("\n" + "=" * 80)
    print("API FIELD DISCOVERY REPORT")
    print("=" * 80)
    print(f"\nTotal Fields: {field_analysis['total_fields']}")
    print(f"Records Analyzed: {geometry_analysis['has_geometry'] + geometry_analysis['missing_geometry']}")
    print(f"Records with Geometry: {geometry_analysis['has_geometry']}")
    print("\nField Names:")
    for field_name in sorted(field_analysis['field_names']):
        primary_type = report['fields'][field_name]['primary_type']
        sample = report['fields'][field_name]['sample_values'][:1]
        sample_str = f" (e.g., {sample[0]})" if sample else ""
        print(f"  - {field_name} [{primary_type}]{sample_str}")
    
    print(f"\nGeometry Type: {geometry_analysis.get('geometry_type', 'none')}")
    print("\nSample Centroids:")
    for coord in geometry_analysis.get('sample_centroids', [])[:3]:
        print(f"  - Lat: {coord['latitude']:.6f}, Lon: {coord['longitude']:.6f}")
    
    print("\n" + "=" * 80)
    print(f"Full report saved to: {output_file}")
    print("=" * 80 + "\n")


def main():
    """
    Main entry point for field discovery script
    """
    api_url = os.getenv('PERMITIQ_SWFWMD_API_URL')
    
    if not api_url:
        logger.error("PERMITIQ_SWFWMD_API_URL not set in environment")
        logger.error("Please create a .env file based on .env.example")
        return
    
    try:
        # Fetch sample permits
        sample_permits = fetch_sample_permits(api_url, sample_size=100)
        
        # Analyze structure
        field_analysis = analyze_field_structure(sample_permits)
        geometry_analysis = analyze_geometry(sample_permits)
        
        # Generate report
        generate_report(field_analysis, geometry_analysis)
        
        logger.info("Field discovery complete!")
        
    except Exception as e:
        logger.error(f"Field discovery failed: {e}")
        raise


if __name__ == '__main__':
    main()
