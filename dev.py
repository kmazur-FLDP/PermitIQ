#!/usr/bin/env python3
"""
PermitIQ - Development Helper Script
Quick commands for common development tasks

Usage:
    python dev.py discover     # Run API field discovery
    python dev.py test         # Test ETL with dry run
    python dev.py load         # Load data into database
    python dev.py stats        # Recalculate statistics
    python dev.py count        # Count records in database
    python dev.py recent       # Show recent permits
"""

import sys
import os
import subprocess
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))


def run_command(cmd: str, description: str):
    """Run a shell command with description"""
    print(f"\n{'='*80}")
    print(f"  {description}")
    print('='*80)
    result = subprocess.run(cmd, shell=True, cwd=PROJECT_ROOT)
    return result.returncode


def discover():
    """Run API field discovery"""
    return run_command(
        "python etl/discover_fields.py",
        "Discovering API field structure..."
    )


def test():
    """Test ETL with dry run"""
    env = os.environ.copy()
    env['PERMITIQ_DRY_RUN'] = 'true'
    
    print(f"\n{'='*80}")
    print("  Testing ETL pipeline (DRY RUN - no database writes)")
    print('='*80)
    
    result = subprocess.run(
        ["python", "etl/fetch_permits.py"],
        cwd=PROJECT_ROOT,
        env=env
    )
    return result.returncode


def load():
    """Load data into database"""
    print(f"\n{'='*80}")
    print("  WARNING: This will load data into the database!")
    print('='*80)
    
    confirm = input("Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Cancelled.")
        return 1
    
    return run_command(
        "python etl/fetch_permits.py",
        "Loading data into database..."
    )


def stats():
    """Recalculate statistics"""
    script = """
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('PERMITIQ_SUPABASE_URL'),
    os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY')
)

print("Refreshing statistics for last 7 days...")
supabase.rpc('refresh_statistics', {'days_back': 7}).execute()
print("Statistics updated!")
"""
    
    print(f"\n{'='*80}")
    print("  Recalculating statistics...")
    print('='*80)
    
    result = subprocess.run(
        ["python", "-c", script],
        cwd=PROJECT_ROOT
    )
    return result.returncode


def count():
    """Count records in database"""
    script = """
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('PERMITIQ_SUPABASE_URL'),
    os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY')
)

print("\\nRecord counts:")
print("-" * 40)

# Permits
result = supabase.table('erp_permits').select('*', count='exact').limit(1).execute()
print(f"Permits: {result.count:,}")

# Changes
result = supabase.table('erp_permit_changes').select('*', count='exact').limit(1).execute()
print(f"Changes: {result.count:,}")

# Statistics
result = supabase.table('erp_statistics').select('*', count='exact').limit(1).execute()
print(f"Statistics: {result.count:,}")

print("-" * 40)
"""
    
    print(f"\n{'='*80}")
    print("  Counting database records...")
    print('='*80)
    
    result = subprocess.run(
        ["python", "-c", script],
        cwd=PROJECT_ROOT
    )
    return result.returncode


def recent():
    """Show recent permits"""
    script = """
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('PERMITIQ_SUPABASE_URL'),
    os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY')
)

print("\\nMost recent permits:")
print("-" * 80)

result = supabase.table('erp_permits')\\
    .select('permit_number,applicant_name,county,issue_date')\\
    .order('issue_date', desc=True)\\
    .limit(10)\\
    .execute()

for permit in result.data:
    print(f"{permit['permit_number']:20} {permit['applicant_name']:40} {permit['county']:15} {permit.get('issue_date', 'N/A')}")

print("-" * 80)
"""
    
    print(f"\n{'='*80}")
    print("  Fetching recent permits...")
    print('='*80)
    
    result = subprocess.run(
        ["python", "-c", script],
        cwd=PROJECT_ROOT
    )
    return result.returncode


def help_text():
    """Show help"""
    print(__doc__)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        help_text()
        return 1
    
    command = sys.argv[1].lower()
    
    commands = {
        'discover': discover,
        'test': test,
        'load': load,
        'stats': stats,
        'count': count,
        'recent': recent,
        'help': help_text,
    }
    
    if command not in commands:
        print(f"Unknown command: {command}")
        help_text()
        return 1
    
    return commands[command]()


if __name__ == '__main__':
    sys.exit(main())
