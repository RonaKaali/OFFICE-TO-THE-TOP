Write-Host "Starting setup for Demo Client..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    Write-Warning ".env file missing!"
}
npm install --production
Write-Host "Setup complete! Run scripts\start-client.ps1 to start." -ForegroundColor Green
