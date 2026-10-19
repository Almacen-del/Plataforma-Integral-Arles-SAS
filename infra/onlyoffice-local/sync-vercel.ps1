param([string]$PublicURL)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$taskPlatform='https://plataforma-integral-arles-demo.vercel.app'
if (!$PublicURL) { $PublicURL=(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime/public-url.txt') -Raw).Trim() }
$taskURI=[Uri]$PublicURL
if ($taskURI.Scheme -ne 'https' -or $taskURI.UserInfo -or $taskURI.Query -or $taskURI.Fragment -or $taskURI.AbsolutePath -ne '/') { throw 'La direccion HTTPS del motor no es valida.' }
$taskCurrent=Invoke-RestMethod ($taskPlatform+'/api/onlyoffice/health') -TimeoutSec 20
if ($taskCurrent.serverURL -eq $taskURI.GetLeftPart([UriPartial]::Authority)) { Write-Output 'Vercel ya esta conectado al enlace actual del motor.'; return }
$taskCLI=Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'npm-cache\_npx\*\node_modules\vercel\dist\index.js') -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (!$taskCLI) { throw 'No se encontro Vercel CLI. Instala la CLI e inicia sesion para reconectar el motor.' }
$taskPreviousCI=$env:CI
try {
 $env:CI='true'
 Write-Output 'Actualizando en Vercel la direccion publica del motor...'
 & node $taskCLI.FullName env add ONLYOFFICE_SERVER_URL production --value $taskURI.GetLeftPart([UriPartial]::Authority) --no-sensitive --force --yes --scope almacen-2787s-projects --cwd $taskRoot
 if ($LASTEXITCODE -ne 0) { throw 'No se pudo actualizar la direccion. Comprueba tu sesion de Vercel.' }
 & node $taskCLI.FullName redeploy $taskPlatform --target production --scope almacen-2787s-projects --cwd $taskRoot --non-interactive
 if ($LASTEXITCODE -ne 0) { throw 'La direccion se actualizo, pero la republicacion no termino. Ejecuta la reconexion nuevamente.' }
} finally { $env:CI=$taskPreviousCI }
