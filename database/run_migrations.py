#!/usr/bin/env python3
"""
PermitIQ Migration Runner
Applies database migrations to Supabase PostgreSQL database

Usage:
    python database/run_migrations.py [migration_file]
    python database/run_migrations.py --all  # Run all pending migrations
"""

import os
import sys
import glob
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import re

# Load environment variables
load_dotenv()

class MigrationRunner:
    def __init__(self):
        self.supabase_url = os.getenv('PERMITIQ_SUPABASE_URL')
        self.supabase_key = os.getenv('PERMITIQ_SUPABASE_SERVICE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing required environment variables: PERMITIQ_SUPABASE_URL, PERMITIQ_SUPABASE_SERVICE_KEY")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        print(f"✓ Connected to Supabase: {self.supabase_url}\n")
    
    def get_migration_files(self, specific_file=None):
        """Get list of migration files to run"""
        migrations_dir = Path(__file__).parent / 'migrations'
        
        if specific_file:
            return [Path(specific_file)]
        
        # Get all .sql files sorted by name (001_, 002_, etc.)
        migration_files = sorted(migrations_dir.glob('*.sql'))
        return migration_files
    
    def execute_sql_statements(self, sql_content):
        """Execute SQL by splitting into individual statements"""
        # Remove comments
        sql_content = re.sub(r'--.*$', '', sql_content, flags=re.MULTILINE)
        sql_content = re.sub(r'/\*.*?\*/', '', sql_content, flags=re.DOTALL)
        
        # Split by semicolon, but preserve DO blocks
        statements = []
        current_statement = []
        in_do_block = False
        
        for line in sql_content.split('\n'):
            current_statement.append(line)
            
            # Track DO blocks
            if 'DO $$' in line or 'DO $' in line:
                in_do_block = True
            elif in_do_block and ('END $$;' in line or 'END $' in line):
                in_do_block = False
                statements.append('\n'.join(current_statement))
                current_statement = []
            elif not in_do_block and ';' in line:
                statements.append('\n'.join(current_statement))
                current_statement = []
        
        if current_statement:
            statements.append('\n'.join(current_statement))
        
        # Filter out empty statements
        statements = [s.strip() for s in statements if s.strip()]
        
        return statements
    
    def run_migration(self, migration_file):
        """Run a single migration file"""
        print(f"{'='*60}")
        print(f"Running migration: {migration_file.name}")
        print(f"{'='*60}\n")
        
        try:
            # Read migration file
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            # Since we can't use exec_sql RPC, we'll need to use psycopg2 or execute via SQL editor
            # For now, let's output instructions
            print(f"⚠️  Automatic migration execution requires database direct connection.")
            print(f"Please run this migration manually using one of these methods:\n")
            print(f"Option 1: Supabase Dashboard SQL Editor")
            print(f"  1. Go to: {self.supabase_url.replace('https://', 'https://supabase.com/dashboard/project/')}")
            print(f"  2. Navigate to SQL Editor")
            print(f"  3. Paste contents of: {migration_file}")
            print(f"  4. Click 'Run'\n")
            
            print(f"Option 2: Using psql CLI")
            print(f"  psql 'postgresql://postgres:[YOUR-PASSWORD]@db.{self.supabase_url.split('//')[1].split('.')[0]}.supabase.co:5432/postgres' \\")
            print(f"    -f {migration_file}\n")
            
            print(f"Migration file location: {migration_file.absolute()}")
            print(f"\nPress Enter after running the migration to continue...")
            input()
            
            return True
            
        except Exception as e:
            print(f"❌ Error running migration: {str(e)}")
            return False
    
    def run_all_migrations(self):
        """Run all migration files"""
        migration_files = self.get_migration_files()
        
        print(f"Found {len(migration_files)} migration files:\n")
        for mf in migration_files:
            print(f"  - {mf.name}")
        print()
        
        successful = 0
        failed = 0
        
        for migration_file in migration_files:
            if self.run_migration(migration_file):
                successful += 1
            else:
                failed += 1
                print(f"\n⚠️  Migration failed. Stop here? (y/n): ", end='')
                if input().lower() == 'y':
                    break
        
        print(f"\n{'='*60}")
        print(f"Migration Summary:")
        print(f"  Successful: {successful}")
        print(f"  Failed: {failed}")
        print(f"{'='*60}\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python database/run_migrations.py <migration_file> | --all")
        print("\nExamples:")
        print("  python database/run_migrations.py database/migrations/004_add_permit_history.sql")
        print("  python database/run_migrations.py --all")
        sys.exit(1)
    
    try:
        runner = MigrationRunner()
        
        if sys.argv[1] == '--all':
            runner.run_all_migrations()
        else:
            migration_file = Path(sys.argv[1])
            if not migration_file.exists():
                print(f"Error: Migration file not found: {migration_file}")
                sys.exit(1)
            runner.run_migration(migration_file)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
