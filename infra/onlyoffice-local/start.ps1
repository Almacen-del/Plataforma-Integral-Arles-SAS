param([switch]$NoOpen,[switch]$SkipVercelSync)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$taskDirectory=$PSScriptRoot
$taskRoot=(Resolve-Path (Join-Path $taskDirectory '..\..')).Path
$taskRuntime=Join-Path $taskDirectory 'runtime'
New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $taskDirectory 'private') -Force | Out-Null
$taskEnv=Join-Path $taskDirectory '.env'
if (!(Test-Path -LiteralPath $taskEnv)) {
  $taskBytes=New-Object byte[] 32
  $taskRandom=[Security.Cryptography.RandomNumberGenerator]::Create()
  $taskRandom.GetBytes($taskBytes); $taskRandom.Dispose()
  $taskSecret=([BitConverter]::ToString($taskBytes)).Replace('-','').ToLowerInvariant()
  [IO.File]::WriteAllText($taskEnv,"ONLYOFFICE_JWT_SECRET=$taskSecret`nARLES_PORT=4174`nONLYOFFICE_ALLOWED_ORIGINS=https://plataforma-integral-arles-demo.vercel.app,https://plataforma-integral-arles-demo-almacen-2787s-projects.vercel.app`n")
}
docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Abre Docker Desktop y vuelve a ejecutar este archivo.' }
docker compose --project-directory $taskDirectory config --quiet
if ($LASTEXITCODE -ne 0) { throw 'La configuracion local no es valida.' }
docker compose --project-directory $taskDirectory up -d
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar ONLYOFFICE.' }

$taskCloudflared=Join-Path $taskRuntime 'cloudflared.exe'
if (!(Test-Path -LiteralPath $taskCloudflared)) {
  $taskRelease=Invoke-RestMethod 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest'
  $taskAsset=$taskRelease.assets | Where-Object name -eq 'cloudflared-windows-amd64.exe'
  if (!$taskAsset -or !$taskAsset.digest.StartsWith('sha256:')) { throw 'No se pudo verificar la descarga oficial de Cloudflare.' }
  Invoke-WebRequest $taskAsset.browser_download_url -OutFile $taskCloudflared
  $taskActual=(Get-FileHash -LiteralPath $taskCloudflared -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($taskActual -ne $taskAsset.digest.Substring(7)) { throw 'La descarga no coincide con la firma SHA256 publicada.' }
  [IO.File]::WriteAllText((Join-Path $taskRuntime 'cloudflared-version.txt'),$taskRelease.tag_name)
}
function Get-TaskProcess([string]$file,[string]$expected) {
  if (!(Test-Path -LiteralPath $file)) { return $null }
  $taskPidValue=[int](Get-Content -LiteralPath $file -Raw)
  $taskProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$taskPidValue" -ErrorAction SilentlyContinue
  if ($taskProcess -and $taskProcess.CommandLine.Contains($expected)) { return $taskProcess }
  return $null
}
$taskServer=Join-Path $taskRoot 'server.mjs'
$taskServerPid=Join-Path $taskRuntime 'server.pid'
if (!(Get-TaskProcess $taskServerPid $taskServer)) {
  $taskOldLocal=$env:ARLES_ONLYOFFICE_LOCAL; $taskOldPort=$env:ARLES_PORT
  try {
    $env:ARLES_ONLYOFFICE_LOCAL='true'; $env:ARLES_PORT='4174'
    $taskNode=(Get-Command node.exe).Source
    $taskNodeProcess=Start-Process -FilePath $taskNode -ArgumentList @('"'+$taskServer+'"') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'server.out.log') -RedirectStandardError (Join-Path $taskRuntime 'server.err.log') -PassThru
    [IO.File]::WriteAllText($taskServerPid,[string]$taskNodeProcess.Id)
  } finally { $env:ARLES_ONLYOFFICE_LOCAL=$taskOldLocal; $env:ARLES_PORT=$taskOldPort }
}
$taskTunnelPid=Join-Path $taskRuntime 'tunnel.pid'
if (!(Get-TaskProcess $taskTunnelPid $taskCloudflared)) {
  $taskTunnel=Start-Process -FilePath $taskCloudflared -ArgumentList @('tunnel','--url','http://127.0.0.1:4174','--protocol','http2','--no-autoupdate') -WorkingDirectory $taskRuntime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'tunnel.out.log') -RedirectStandardError (Join-Path $taskRuntime 'tunnel.err.log') -PassThru
  [IO.File]::WriteAllText($taskTunnelPid,[string]$taskTunnel.Id)
}
$taskLink=$null
for ($taskAttempt=0; $taskAttempt -lt 45; $taskAttempt++) {
  $taskLog=Get-Content -LiteralPath (Join-Path $taskRuntime 'tunnel.err.log') -Raw -ErrorAction SilentlyContinue
  if ($taskLog -match 'https://[a-z0-9-]+\.trycloudflare\.com') { $taskLink=$Matches[0]; break }
  Start-Sleep -Seconds 2
}
if (!$taskLink) { throw 'El enlace HTTPS no se genero. Revisa runtime/tunnel.err.log.' }
[IO.File]::WriteAllText((Join-Path $taskRuntime 'public-url.txt'),$taskLink)
Write-Output "Enlace temporal del motor: $taskLink"
if (!$SkipVercelSync) {
  try { & (Join-Path $taskDirectory 'sync-vercel.ps1') -PublicURL $taskLink }
  catch { Write-Warning ('El motor inicio, pero su conexion con Vercel necesita revision: '+$_.Exception.Message) }
}
Write-Output 'Pagina de Arles: https://plataforma-integral-arles-demo.vercel.app'
Write-Output 'El motor puede tardar unos minutos en iniciar. El equipo y Docker deben permanecer encendidos.'
if (!$NoOpen) { Start-Process 'https://plataforma-integral-arles-demo.vercel.app' }
