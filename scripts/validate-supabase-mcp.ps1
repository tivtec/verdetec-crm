Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$required = @(
  "supabase-dev-ro",
  "supabase-dev-rw",
  "supabase-stg-rw"
)

function Get-McpConfig {
  param([string]$Name)

  $raw = & codex mcp get $Name --json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "MCP server '$Name' is missing or invalid. Details: $raw"
  }

  return ($raw | ConvertFrom-Json)
}

Write-Host "Validating MCP server registrations..."

$configs = @{}
foreach ($name in $required) {
  $configs[$name] = Get-McpConfig -Name $name
}

$devRoUrl = $configs["supabase-dev-ro"].transport.url
$devRwUrl = $configs["supabase-dev-rw"].transport.url
$stgRwUrl = $configs["supabase-stg-rw"].transport.url

if ($devRoUrl -notmatch "read_only=true") {
  throw "supabase-dev-ro must include read_only=true"
}

if ($stgRwUrl -match "REPLACE_WITH_STAGING_PROJECT_REF") {
  throw "supabase-stg-rw still has placeholder project_ref. Update staging ref first."
}

if ($devRoUrl -eq $stgRwUrl -or $devRwUrl -eq $stgRwUrl) {
  throw "Staging MCP URL matches dev URL. Use a dedicated staging project_ref."
}

Write-Host "All MCP checks passed."
Write-Host ""
& codex mcp list

