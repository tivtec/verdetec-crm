# Supabase MCP Runbook (Dev/Staging)

## Objective
Enable Codex to operate directly on Supabase for:
- SQL exploration and controlled data changes
- Schema changes via named migrations
- Edge Function deployment
- Table and view inspection

Scope is only `dev` and `staging`. Production is out of scope.

## Required Inputs
- `DEV_PROJECT_REF` (already discoverable from `NEXT_PUBLIC_SUPABASE_URL`)
- `STAGING_PROJECT_REF` (must be provided explicitly)
- `SUPABASE_ACCESS_TOKEN` (PAT) when OAuth is not used

## One-time Setup
Use the bootstrap script:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/setup-supabase-mcp.ps1 -StagingProjectRef "<STAGING_PROJECT_REF>"
```

Optional OAuth login during setup:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/setup-supabase-mcp.ps1 -StagingProjectRef "<STAGING_PROJECT_REF>" -UseOAuth
```

This configures:
- `supabase-dev-ro` (read-only)
- `supabase-dev-rw` (write-enabled)
- `supabase-stg-rw` (write-enabled)

## Manual Setup (Alternative)
```powershell
codex mcp add supabase-dev-ro --url "https://mcp.supabase.com/mcp?project_ref=<DEV_PROJECT_REF>&read_only=true&features=database,docs,development,debugging,functions" --bearer-token-env-var SUPABASE_ACCESS_TOKEN
codex mcp add supabase-dev-rw --url "https://mcp.supabase.com/mcp?project_ref=<DEV_PROJECT_REF>&features=database,development,debugging,functions,branching" --bearer-token-env-var SUPABASE_ACCESS_TOKEN
codex mcp add supabase-stg-rw --url "https://mcp.supabase.com/mcp?project_ref=<STAGING_PROJECT_REF>&features=database,development,debugging,functions,branching" --bearer-token-env-var SUPABASE_ACCESS_TOKEN
```

OAuth login:
```powershell
codex mcp login supabase-dev-ro
codex mcp login supabase-dev-rw --scopes projects:write
codex mcp login supabase-stg-rw --scopes projects:write
```

## Governance Rules
- Use `supabase-dev-ro` by default for investigation.
- Use `supabase-dev-rw` only when a change is approved.
- Use `supabase-stg-rw` only after dev validation.
- For destructive operations (`DROP`, mass `DELETE`, risky `ALTER`), require explicit human confirmation every time.

## Change Workflow
1. Explore schema/data with read-only server.
2. Create named SQL migration in `supabase/migrations`.
3. Apply in dev using write-enabled server.
4. Validate behavior in application.
5. Promote to staging only after dev passes.
6. Keep code and database changes synchronized in the repository.

## Edge Function Workflow
1. Implement/update function source in repository.
2. Deploy and validate in dev first.
3. Promote to staging only after validation.

## Rollback Playbook
- Preferred: add a reverse migration (`down` behavior as forward SQL file).
- Data incident: restore from Supabase backup/point-in-time restore when required.
- Branch incident: use branch reset strategy in non-production environments.

## Validation Checklist
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/validate-supabase-mcp.ps1
```

Expected:
- 3 MCP servers are listed.
- `supabase-dev-ro` URL contains `read_only=true`.
- `supabase-stg-rw` is configured with a real staging `project_ref`.
