@echo off
setlocal enabledelayedexpansion

echo ====================================
echo      Setting up Schedify Backend    
echo ====================================

:: 1. Activate Virtual Environment
echo.
echo [0/4] Activating Virtual Environment...
call venv\Scripts\activate.bat

:: 2. Database Option Prompt
echo.
echo ------------------------------------
echo [1] Continue with existing database
echo [2] Reset / Recreate database (DELETES ALL DATA)
echo ------------------------------------
set /p DB_CHOICE="Select an option (1 or 2, default is 1): "

if "%DB_CHOICE%"=="2" (
    echo.
    echo [!] Resetting Database...
    python -c "import os; from dotenv import load_dotenv; load_dotenv('.env'); import psycopg; db_user=os.getenv('DB_USER', 'postgres'); db_pass=os.getenv('DB_PASSWORD', ''); db_host=os.getenv('DB_HOST', 'localhost'); db_port=os.getenv('DB_PORT', '5432'); db_name=os.getenv('DB_NAME', 'schedify_db'); conn = psycopg.connect(f'dbname=postgres user={db_user} password={db_pass} host={db_host} port={db_port}'); conn.autocommit = True; cur = conn.cursor(); cur.execute(f'DROP DATABASE IF EXISTS {db_name};'); cur.execute(f'CREATE DATABASE {db_name};'); print(f'--> Database {db_name} recreated successfully.');"
) else (
    echo.
    echo [i] Keeping existing database.
)

:: 3. Run Migrations
echo.
echo [2/4] Running Database Migrations...
python manage.py makemigrations
python manage.py migrate

:: 4. Create Superuser
echo.
echo [3/4] Checking / Creating Superuser...
python manage.py setup_admin

:: 5. Start Server
echo.
echo [4/4] Starting Django Development Server...
python manage.py runserver

pause