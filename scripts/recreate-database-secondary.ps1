# Script para recrear la base de datos secundaria desde cero
# ADVERTENCIA: Esto BORRARÁ todos los datos existentes

Write-Host "🔄 Recreando base de datos SECUNDARIA desde cero..." -ForegroundColor Yellow
Write-Host ""

# Paso 1: Detener SOLO MySQL secondary
Write-Host "📦 Paso 1: Deteniendo MySQL secondary..." -ForegroundColor Cyan
docker stop mysql-secondary 2>$null
docker rm mysql-secondary 2>$null
Write-Host "   ✓ MySQL secondary detenido" -ForegroundColor Green

# Paso 2: Eliminar volúmenes (ESTO BORRA LOS DATOS)
Write-Host "🗑️  Paso 2: Eliminando volúmenes de MySQL secondary..." -ForegroundColor Cyan
Remove-Item -Path ".\volumes\mysql-secondary\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Volumen mysql-secondary eliminado" -ForegroundColor Green

# Paso 3: Levantar SOLO MySQL secondary
Write-Host "🚀 Paso 3: Levantando MySQL secondary con nuevo schema..." -ForegroundColor Cyan
docker-compose up -d mysql-secondary
Write-Host "   ✓ MySQL secondary iniciado" -ForegroundColor Green

# Paso 4: Esperar a que MySQL esté listo
Write-Host "⏳ Paso 4: Esperando a que MySQL esté listo..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

# Paso 5: Verificar que las tablas se crearon
Write-Host "✅ Paso 5: Verificando tablas creadas..." -ForegroundColor Cyan
docker exec mysql-secondary mysql -uadmin -p'3deAsada.' -D analytics_db -e "SHOW TABLES;" 2>$null

Write-Host ""
Write-Host "✨ ¡Base de datos SECUNDARIA recreada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Tablas creadas:" -ForegroundColor Cyan
Write-Host "   - activity_logs" -ForegroundColor White
Write-Host "   - metrics" -ForegroundColor White
Write-Host "   - search_logs" -ForegroundColor White
Write-Host "   - payment" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   Conectar a MySQL secondary:" -ForegroundColor White
Write-Host "   docker exec -it mysql-secondary mysql -uadmin -p'3deAsada.' -D analytics_db" -ForegroundColor Gray
Write-Host ""
Write-Host "   Ver todas las tablas:" -ForegroundColor White
Write-Host "   docker exec mysql-secondary mysql -uadmin -p'3deAsada.' -D analytics_db -e 'SHOW TABLES;'" -ForegroundColor Gray
Write-Host ""
Write-Host "   Ver estructura de payment:" -ForegroundColor White
Write-Host "   docker exec mysql-secondary mysql -uadmin -p'3deAsada.' -D analytics_db -e 'DESCRIBE payment;'" -ForegroundColor Gray
Write-Host ""
