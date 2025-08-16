@echo off
echo Sorting files...
echo.
for /f "usebackq delims=" %%f in (`dir /b /on "units\*.js" ^| findstr /v /i /r /c:"^index\.js$"`) do echo %%f
echo.
echo Catalogging files...
(
echo window.UNIT_CATALOG = [
for /f "usebackq delims=" %%f in (`dir /b /on "units\*.js" ^| findstr /v /i /r /c:"^index\.js$"`) do echo   "%%~nxf",
echo ]
) > units\index.js
powershell -NoProfile -Command ^
  "(Get-Content 'units\index.js' -Raw) -replace ',(?=\s*\])', '' | Set-Content 'units\index.js' -NoNewline"
echo.
echo DONE
pause