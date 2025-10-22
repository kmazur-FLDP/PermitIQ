# macOS Python Setup Notes

## ✅ Installation Complete!

Your Python environment is now set up and ready to use.

## Python Commands on macOS

On your Mac, always use `python3` instead of `python`:

```bash
# ✅ CORRECT - Use these commands
python3 --version
python3 -m venv venv
python3 -m pip install package-name

# ❌ WRONG - These won't work
python --version
pip install package-name
```

## Virtual Environment

A virtual environment has been created in `/venv` to isolate project dependencies.

### Activating the Virtual Environment

**Every time** you work on PermitIQ, activate the environment first:

```bash
cd "/Users/kevinmazur/Documents/Kevin Work/PermitIQ"
source venv/bin/activate
```

You'll see `(venv)` appear in your terminal prompt when it's active.

### Deactivating

When you're done:

```bash
deactivate
```

## Running PermitIQ Scripts

### With Virtual Environment Active (Recommended)

```bash
source venv/bin/activate
python etl/fetch_permits.py
python etl/discover_fields.py
python dev.py discover
```

### Without Activating (Alternative)

```bash
python3 etl/fetch_permits.py
python3 etl/discover_fields.py
python3 dev.py discover
```

## Installed Packages

The following packages are now installed in your virtual environment:

**Core Dependencies:**
- `requests` - HTTP library for API calls
- `python-dotenv` - Environment variable management
- `supabase` - Supabase client (includes PostgreSQL tools)

**Development Tools:**
- `black` - Code formatter
- `pylint` - Code linter
- `pytest` - Testing framework

## Next Steps

1. **Set up Supabase** (see QUICKSTART.md)
2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Then edit .env with your credentials
   ```

3. **Test the ETL pipeline:**
   ```bash
   source venv/bin/activate
   python dev.py discover
   ```

## Troubleshooting

### "command not found: pip"
- ✅ Use `python3 -m pip` instead

### "externally-managed-environment"
- ✅ Already fixed! You're using a virtual environment

### Import errors
- ✅ Make sure virtual environment is activated
- Check with: `which python` (should show path in `venv/`)

### Permission errors
- ❌ Don't use `sudo pip install`
- ✅ Use virtual environment (already set up)

## Pro Tips

1. **Always activate venv first** when working on PermitIQ
2. **Use `python` (not `python3`) inside venv** - it's aliased correctly
3. **Keep venv/ in .gitignore** (already configured)
4. **Recreate venv if corrupted:**
   ```bash
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

**Environment Status:** ✅ Ready to go!

Run `python dev.py discover` to start exploring the SWFWMD API.
