param([string]$CorpusRoot = 'output/word-corpus-50')
$ErrorActionPreference='Stop'
$rootAudit=(Resolve-Path -LiteralPath $CorpusRoot).Path
$outAudit=Join-Path $rootAudit 'referencia-microsoft-word'
New-Item -ItemType Directory -Force -Path $outAudit | Out-Null
$manifestAudit=Get-Content -LiteralPath (Join-Path $rootAudit 'manifest.json') -Raw | ConvertFrom-Json
$resultsAudit=@()
$wordAudit=New-Object -ComObject Word.Application
try {
 $wordAudit.Visible=$false
 $wordAudit.DisplayAlerts=0
 $wordAudit.AutomationSecurity=3
 foreach($entryAudit in $manifestAudit){
  $sourceAudit=Join-Path (Join-Path $rootAudit 'originales') $entryAudit.filename
  $beforeAudit=(Get-FileHash -LiteralPath $sourceAudit -Algorithm SHA256).Hash.ToLowerInvariant()
  if($beforeAudit -ne $entryAudit.sha256){throw "Original alterado antes de abrir: $sourceAudit"}
  $docAudit=$null
  try {
   $docAudit=$wordAudit.Documents.Open($sourceAudit,$false,$true,$false)
   $pdfAudit=Join-Path $outAudit ('{0:D2}.pdf' -f [int]$entryAudit.id)
   $docAudit.ExportAsFixedFormat($pdfAudit,17)
   $rowAudit=[ordered]@{id=$entryAudit.id;pages=$docAudit.ComputeStatistics(2);sha256=$beforeAudit;pdf=$pdfAudit;error=$null}
  } catch {$rowAudit=[ordered]@{id=$entryAudit.id;error=$_.Exception.Message}}
  finally {if($null -ne $docAudit){$docAudit.Close(0)}}
  $afterAudit=(Get-FileHash -LiteralPath $sourceAudit -Algorithm SHA256).Hash.ToLowerInvariant()
  $rowAudit.originalIntact=$beforeAudit -eq $afterAudit
  $resultsAudit+=[pscustomobject]$rowAudit
  $resultsAudit | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outAudit 'resultados.json') -Encoding utf8
  Write-Output ('Word {0}: {1} páginas; original intacto: {2}; {3}' -f $entryAudit.id,$rowAudit.pages,$rowAudit.originalIntact,$rowAudit.error)
 }
} finally {$wordAudit.Quit()}
if($resultsAudit | Where-Object {$_.error -or -not $_.originalIntact}){exit 1}
