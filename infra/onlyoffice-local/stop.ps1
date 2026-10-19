$ErrorActionPreference='Stop'
$taskDirectory=$PSScriptRoot
$taskRoot=(Resolve-Path (Join-Path $taskDirectory '..\..')).Path
$taskRuntime=Join-Path $taskDirectory 'runtime'
Write-Output 'Deteniendo el motor. Las sesiones, originales y pendientes se conservan.'
docker compose --project-directory $taskDirectory stop
if ($LASTEXITCODE -ne 0) { throw 'El motor no confirmo la detencion. Se mantienen los otros servicios para conservar el guardado.' }
foreach ($taskEntry in @(@('tunnel.pid',(Join-Path $taskRuntime 'cloudflared.exe')),@('server.pid',(Join-Path $taskRoot 'server.mjs')))) {
  $taskPidFile=Join-Path $taskRuntime $taskEntry[0]
  if (Test-Path -LiteralPath $taskPidFile) {
    $taskPidValue=[int](Get-Content -LiteralPath $taskPidFile -Raw)
    $taskProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$taskPidValue" -ErrorAction SilentlyContinue
    if ($taskProcess -and $taskProcess.CommandLine.Contains($taskEntry[1])) { Stop-Process -Id $taskPidValue }
  }
}
Write-Output 'Servidor temporal detenido. No se han eliminado archivos ni volumenes.'
