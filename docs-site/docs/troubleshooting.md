# Troubleshooting Guide

## Connection Issues
- Ensure DBeaver is installed and has been run at least once
- Verify connections work in DBeaver GUI
- Check file permissions on DBeaver config directory

## Query Execution Issues
- Test queries directly in DBeaver first
- Check connection credentials haven't expired
- Verify query syntax for your specific database type

## Platform-Specific Issues
- **Windows:** Ensure DBeaver is in PATH or set DBEAVER_PATH
- **macOS:** May need to grant terminal permissions to access DBeaver
- **Linux:** Check AppImage vs package installation paths

## General Debugging
- Run with `DBEAVER_DEBUG=true` for more verbose logs
- Check logs for error messages and stack traces
- Ensure Node.js version is 18+

## Getting Help
- Check the documentation in the `docs/` folder
- Open an issue on GitHub with details
- Join our Discord community for support
