#!/usr/bin/env python3
"""
PermitIQ - Competitor Watchlist Test Script
Tests the new competitor tracking functionality
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def main():
    supabase_url = os.getenv('PERMITIQ_SUPABASE_URL')
    supabase_key = os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY')
    supabase = create_client(supabase_url, supabase_key)
    
    print('='*60)
    print('PermitIQ - Competitor Watchlist Demo')
    print('='*60)
    print()
    
    # Add some major competitors
    competitors = [
        {
            'name': 'D.R. Horton',
            'aliases': ['DR Horton', 'D R Horton', 'Horton Homes', 'D.R. Horton Inc'],
            'type': 'direct',
            'priority': 'high'
        },
        {
            'name': 'Lennar Homes',
            'aliases': ['Lennar', 'Lennar Corporation', 'Lennar Corp'],
            'type': 'direct',
            'priority': 'high'
        },
        {
            'name': 'Pulte Group',
            'aliases': ['Pulte Homes', 'Pulte', 'Centex Homes', 'Centex'],
            'type': 'direct',
            'priority': 'medium'
        }
    ]
    
    print('Step 1: Adding competitors to watchlist...\n')
    
    for comp in competitors:
        try:
            # Direct SQL insert to bypass RLS
            result = supabase.table('competitor_watchlist').insert({
                'company_name': comp['name'],
                'company_aliases': comp['aliases'],
                'competitor_type': comp['type'],
                'priority_level': comp['priority'],
                'alert_enabled': True,
                'added_by': 'setup_script'
            }).execute()
            
            competitor_id = result.data[0]['id']
            print(f"✅ Added {comp['name']} (ID: {competitor_id})")
            
            # Now match permits
            print(f"   Searching for permits...")
            match_result = supabase.rpc('match_competitor_permits', {
                'p_competitor_id': competitor_id
            }).execute()
            
            matches = match_result.data
            print(f"   Found {matches} matching permits\n")
            
        except Exception as e:
            if 'duplicate key' in str(e).lower():
                print(f"ℹ️  {comp['name']} already in watchlist\n")
            else:
                print(f"❌ Error adding {comp['name']}: {str(e)}\n")
    
    print()
    print('Step 2: Checking watchlist summary...\n')
    
    # Get all competitors
    watchlist = supabase.table('competitor_watchlist').select('*').execute()
    
    for comp in watchlist.data:
        print(f"Competitor: {comp['company_name']}")
        print(f"  Type: {comp['competitor_type']}")
        print(f"  Priority: {comp['priority_level']}")
        print(f"  Total Permits: {comp['total_permits']}")
        print(f"  Alert Enabled: {comp['alert_enabled']}")
        print()
    
    print('='*60)
    print('Step 3: Testing spatial query...\n')
    
    # Find competitors near Tampa
    tampa_lat = 27.9506
    tampa_lon = -82.4572
    
    print(f'Searching for competitors within 10 miles of Tampa...')
    print(f'Coordinates: ({tampa_lat}, {tampa_lon})\n')
    
    try:
        nearby = supabase.rpc('find_nearby_competitor_activity', {
            'p_longitude': tampa_lon,
            'p_latitude': tampa_lat,
            'p_radius_miles': 10.0
        }).execute()
        
        if nearby.data:
            print(f'Found {len(nearby.data)} competitor permits nearby:\n')
            for i, permit in enumerate(nearby.data[:5], 1):  # Show first 5
                print(f"{i}. {permit['company_name']} - {permit['project_name']}")
                print(f"   Permit: {permit['permit_number']}")
                print(f"   Distance: {permit['distance_miles']} miles")
                print(f"   Priority: {permit['priority_level']}")
                print()
        else:
            print('No competitor permits found in this area.')
    except Exception as e:
        print(f'Error: {str(e)}')
    
    print('='*60)
    print('✨ Competitor watchlist setup complete!')
    print()
    print('Next steps:')
    print('  1. View competitors: SELECT * FROM competitor_watchlist;')
    print('  2. View matches: SELECT * FROM competitor_permit_matches;')
    print('  3. Set up alert rules in alert_rules table')
    print('='*60)

if __name__ == '__main__':
    main()
