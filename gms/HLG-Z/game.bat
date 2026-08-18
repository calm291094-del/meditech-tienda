@echo off
chcp 65001 >nul 2>&1
title Holguin de los Muertos
cd /d "%~dp0"

echo.
echo ============================================================
echo   HOLGUIN DE LOS MUERTOS - LANZADOR
echo ============================================================
echo.
echo Directorio: %CD%
echo.

if not exist "index.html" (
    echo [ERROR] No se encontro index.html
    goto :fin
)

if not exist "server.py" (
    echo [ERROR] No se encontro server.py
    goto :fin
)

set PYTHON_CMD=

where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :python_ok
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python3
    goto :python_ok
)

where py >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :python_ok
)

echo.
echo [ERROR] Python NO esta instalado.
echo Instala desde https://www.python.org/downloads/
echo IMPORTANTE: Marca "Add Python to PATH"
echo.
goto :fin

:python_ok
echo Python: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.
echo Iniciando servidor...
echo.

%PYTHON_CMD% server.py

:fin
echo.
echo Presiona una tecla para cerrar...
pause >nul