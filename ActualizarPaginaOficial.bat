@echo off
title Actualizando KSBravo Pagina Oficial
color 06

echo ===================================================
echo     1. Construyendo y subiendo la pagina web...
echo ===================================================
mkdocs gh-deploy --force

echo.
echo ===================================================
echo     2. Guardando textos en el repositorio...
echo ===================================================
git pull origin main
git add .
git commit -m "Actualizacion de la pagina oficial"
git push origin main

echo.
echo ===================================================
echo   Todo actualizado. Recorda Ctrl + F5 en el navegador.
echo   https://hec-thor-tech.github.io/ksbravo/
echo ===================================================
echo.
pause
