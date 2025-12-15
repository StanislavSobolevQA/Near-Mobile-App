@echo off
chcp 65001 >nul
echo ========================================
echo   ПОЛНАЯ УСТАНОВКА ПРОЕКТА
echo ========================================
echo.

echo [1/2] Установка всех зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости
    pause
    exit /b 1
)
echo ✓ Все зависимости установлены
echo.

echo [2/2] Проверка структуры проекта...
set ERRORS=0

if exist app\actions\requests.ts (
    echo ✓ app/actions/requests.ts
) else (
    echo ✗ app/actions/requests.ts не найден
    set /a ERRORS+=1
)

if %ERRORS% equ 0 (
    echo ✓ Все файлы на месте
) else (
    echo ✗ Найдено ошибок: %ERRORS%
)
echo.

echo ========================================
echo   УСТАНОВКА ЗАВЕРШЕНА
echo ========================================
echo.
echo Запустите проект: npm run dev
echo.
pause
