param([string[]]$Modes = @('mobile', 'desktop'))
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
$edgePath = Join-Path ${env:ProgramFiles(x86)} 'Microsoft/Edge/Application/msedge.exe'
if (!(Test-Path -LiteralPath $edgePath)) { throw 'Microsoft Edge is required for this audit.' }
$env:CHROME_PATH = $edgePath
Invoke-WebRequest 'http://localhost:4187/' -UseBasicParsing | Out-Null
New-Item -ItemType Directory -Force -Path 'reports/lighthouse' | Out-Null
$routes = [ordered]@{ study='study'; packs='library/packs'; cards='library/cards'; notes='library/notes'; mistakes='library/mistakes'; tests='tests'; ab250='tests?bank=ab250-original'; statistics='statistics'; settings='settings' }
$summary = @()
foreach ($mode in $Modes) {
  if ($mode -notin @('mobile','desktop')) { throw 'Mode must be mobile or desktop.' }
  foreach ($entry in $routes.GetEnumerator()) {
    $name = "$($entry.Key)-$mode"
    Write-Host "Auditing $name"
    do { $auditPort = Get-Random -Minimum 20000 -Maximum 60000 } while (Get-NetTCPConnection -LocalPort $auditPort -ErrorAction SilentlyContinue)
    $auditArgs = @('exec','--yes','--package=lighthouse@13.6.0','--','lighthouse',"http://localhost:4187/#$($entry.Value)","--port=$auditPort",'--quiet','--chrome-flags=--headless --no-first-run','--no-enable-error-reporting','--only-categories=performance,accessibility,best-practices,seo','--output=json','--output=html',"--output-path=reports/lighthouse/$name")
    if ($mode -eq 'desktop') { $auditArgs += '--preset=desktop' }
    & npm.cmd @auditArgs
    if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed for $name" }
    $report = Get-Content "reports/lighthouse/$name.report.json" -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($report.runtimeError) { throw $report.runtimeError.message }
    $item = [ordered]@{ name=$name; performance=[math]::Round(100*$report.categories.performance.score); accessibility=[math]::Round(100*$report.categories.accessibility.score); bestPractices=[math]::Round(100*$report.categories.'best-practices'.score); seo=[math]::Round(100*$report.categories.seo.score) }
    $summary += $item
    $item | ConvertTo-Json -Compress | Write-Host
    $summary | ConvertTo-Json | Set-Content 'reports/lighthouse/summary.json' -Encoding utf8
  }
}
