param(
  [string]$DevProjectRef,
  [Parameter(Mandatory = $true)]
  [string]$StagingProjectRef,
  [switch]$UseOAuth
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-DevProjectRef {
  param([string]$RepoRoot, [string]$IncomingRef)

  if ($IncomingRef) {
    return $IncomingRef.Trim()
  }

  $envLocalPath = Join-Path $RepoRoot ".env.local"
  if (-not (Test-Path $envLocalPath)) {
    throw "Missing .env.local and -DevProjectRef was not provided."
  }

  $urlLine = Get-Content $envLocalPath | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" } | Select-Object -First 1
  if (-not $urlLine) {
    throw "NEXT_PUBLIC_SUPABASE_URL not found in .env.local."
  }

  $url = ($urlLine -split "=", 2)[1].Trim()
  $match = [regex]::Match($url, "^https://([^.]+)\.supabase\.co/?$")
  if (-not $match.Success) {
    throw "Could not parse project_ref from NEXT_PUBLIC_SUPABASE_URL: $url"
  }

  return $match.Groups[1].Value
}

function Add-Or-ReplaceMcpServer {
  param(
    [string]$Name,
    [string]$Url
  )

  & codex mcp remove $Name *> $null
  & codex mcp add $Name --url $Url --bearer-token-env-var SUPABASE_ACCESS_TOKEN
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to add MCP server: $Name"
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$resolvedDevRef = Resolve-DevProjectRef -RepoRoot $repoRoot -IncomingRef $DevProjectRef
$resolvedStagingRef = $StagingProjectRef.Trim()

if ($resolvedStagingRef -eq "REPLACE_WITH_STAGING_PROJECT_REF") {
  throw "Provide a real staging project_ref in -StagingProjectRef."
}

$devRoUrl = "https://mcp.supabase.com/mcp?project_ref=$resolvedDevRef&read_only=true&features=database,docs,development,debugging,functions"
$devRwUrl = "https://mcp.supabase.com/mcp?project_ref=$resolvedDevRef&features=database,development,debugging,functions,branching"
$stgRwUrl = "https://mcp.supabase.com/mcp?project_ref=$resolvedStagingRef&features=database,development,debugging,functions,branching"

Add-Or-ReplaceMcpServer -Name "supabase-dev-ro" -Url $devRoUrl
Add-Or-ReplaceMcpServer -Name "supabase-dev-rw" -Url $devRwUrl
Add-Or-ReplaceMcpServer -Name "supabase-stg-rw" -Url $stgRwUrl

Write-Host "MCP servers configured successfully."
Write-Host "Dev project_ref: $resolvedDevRef"
Write-Host "Staging project_ref: $resolvedStagingRef"
Write-Host ""
Write-Host "Current MCP list:"
& codex mcp list

if ($UseOAuth) {
  Write-Host ""
  Write-Host "Starting OAuth login for all MCP servers..."
  & codex mcp login supabase-dev-ro
  & codex mcp login supabase-dev-rw --scopes projects:write
  & codex mcp login supabase-stg-rw --scopes projects:write
} else {
  Write-Host ""
  Write-Host "OAuth login not executed."
  Write-Host "Run manually when ready:"
  Write-Host "  codex mcp login supabase-dev-ro"
  Write-Host "  codex mcp login supabase-dev-rw --scopes projects:write"
  Write-Host "  codex mcp login supabase-stg-rw --scopes projects:write"
  Write-Host ""
  Write-Host "Fallback (no OAuth): set SUPABASE_ACCESS_TOKEN in your shell."
}

