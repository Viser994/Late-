@echo off
REM TSX Stock Scanner - Windows CMD launcher
REM Usage: scan.bat [command] [options]
REM Examples:
REM   scan.bat scan
REM   scan.bat scan --limit 50 --export results.csv
REM   scan.bat universe --refresh
REM   scan.bat lookup RY

cd /d "%~dp0"
python main.py %*
