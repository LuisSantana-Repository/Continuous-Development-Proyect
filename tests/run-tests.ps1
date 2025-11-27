# run-tests.ps1
# Script para ejecutar todas las pruebas de estrés

Write-Host "Iniciando pruebas de estres de Stamin-Up..." -ForegroundColor Yellow
Write-Host ""

# Crear carpeta de resultados
New-Item -Path ".\results" -ItemType Directory -Force | Out-Null

Write-Host "Ejecutando pruebas de estres" -ForegroundColor Cyan
jmeter -n `
  -t .\load_test.jmx `
  -JUSERS=1000 `
  -JRAMP_UP=30 `
  -JDURATION=60 `
  -l .\results\baseline.jtl `
  -e `
  -o .\results\baseline-report\

Write-Host "Abriendo reportes en el navegador..." -ForegroundColor Yellow
Start-Process .\results\baseline-report\index.html
