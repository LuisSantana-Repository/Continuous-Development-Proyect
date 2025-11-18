# Script para recrear la base de datos desde cero
# ADVERTENCIA: Esto BORRARÁ todos los datos existentes

Write-Host "🔄 Recreando base de datos desde cero..." -ForegroundColor Yellow
Write-Host ""

# Paso 1: Detener SOLO MySQL primary
Write-Host "📦 Paso 1: Deteniendo MySQL primary..." -ForegroundColor Cyan
docker stop mysql-primary 2>$null
docker rm mysql-primary 2>$null
Write-Host "   ✓ MySQL primary detenido" -ForegroundColor Green

# Paso 2: Eliminar volúmenes (ESTO BORRA LOS DATOS)
Write-Host "🗑️  Paso 2: Eliminando volúmenes de MySQL..." -ForegroundColor Cyan
Remove-Item -Path ".\volumes\mysql-primary\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Volumen mysql-primary eliminado" -ForegroundColor Green

# Paso 3: Levantar SOLO MySQL primary
Write-Host "🚀 Paso 3: Levantando MySQL primary con nuevo schema..." -ForegroundColor Cyan
docker-compose up -d mysql-primary
Write-Host "   ✓ MySQL primary iniciado" -ForegroundColor Green

# Paso 4: Esperar a que MySQL esté listo
Write-Host "⏳ Paso 4: Esperando a que MySQL esté listo..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

# Paso 5: Verificar que las tablas se crearon
Write-Host "✅ Paso 5: Verificando tablas creadas..." -ForegroundColor Cyan
docker exec mysql-primary mysql -uadmin -p'3deAsada.' -D my-sql-rds-hot -e "SHOW TABLES;" 2>$null

Write-Host ""
Write-Host "✨ ¡Base de datos recreada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Tablas creadas:" -ForegroundColor Cyan
Write-Host "   - users" -ForegroundColor White
Write-Host "   - ServiceType" -ForegroundColor White
Write-Host "   - providers" -ForegroundColor White
Write-Host "   - service_requests" -ForegroundColor White
Write-Host "   - user_reviews" -ForegroundColor White
Write-Host "   - provider_reviews" -ForegroundColor Yellow
Write-Host "   - user_reports" -ForegroundColor Yellow
Write-Host "   - provider_reports" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   Conectar a MySQL:" -ForegroundColor White
Write-Host "   docker exec -it mysql-primary mysql -uadmin -p'3deAsada.' -D my-sql-rds-hot" -ForegroundColor Gray