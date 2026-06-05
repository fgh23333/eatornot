# EatOrNot Claude Code Skill Installer (PowerShell)
# Usage: .\scripts\claude-setup\install.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$SetupDir = Join-Path $ProjectRoot ".claude"
$SkillsDir = Join-Path $SetupDir "skills"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  EatOrNot Claude Code Installer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create .claude directories
if (-not (Test-Path $SkillsDir)) {
    New-Item -ItemType Directory -Path $SkillsDir -Force | Out-Null
    Write-Host "[OK] Created $SkillsDir" -ForegroundColor Green
} else {
    Write-Host "[--] Skills dir already exists" -ForegroundColor Gray
}

# 2. Copy skill file
$SkillSrc = Join-Path $PSScriptRoot "skills\meal-order.md"
$SkillDst = Join-Path $SkillsDir "meal-order.md"
if (Test-Path $SkillSrc) {
    Copy-Item -Path $SkillSrc -Destination $SkillDst -Force
    Write-Host "[OK] Installed skill: meal-order" -ForegroundColor Green
} else {
    Write-Host "[ERR] Skill source not found: $SkillSrc" -ForegroundColor Red
    exit 1
}

# 3. Auto-merge settings.local.json permissions
$SettingsTemplate = Join-Path $PSScriptRoot "settings.local.json.template"
$SettingsDst = Join-Path $SetupDir "settings.local.json"

if (Test-Path $SettingsDst) {
    Write-Host "[--] Found existing settings.local.json, merging permissions..." -ForegroundColor Yellow

    # Read existing settings
    $existing = Get-Content -Path $SettingsDst -Raw -Encoding UTF8 | ConvertFrom-Json
    $template = Get-Content -Path $SettingsTemplate -Raw -Encoding UTF8 | ConvertFrom-Json

    # Collect existing allows into a HashSet
    $existingAllows = [System.Collections.Generic.HashSet[string]]::new()
    if ($existing.permissions.allow) {
        foreach ($a in $existing.permissions.allow) {
            $existingAllows.Add($a) | Out-Null
        }
    }

    # Add template allows that aren't already present
    $added = 0
    if ($template.permissions.allow) {
        foreach ($a in $template.permissions.allow) {
            if ($existingAllows.Add($a)) {
                $added++
            }
        }
    }

    # Write back merged settings
    $merged = @{
        permissions = @{
            allow = @($existingAllows | Sort-Object)
        }
    }
    $merged | ConvertTo-Json -Depth 10 | Set-Content -Path $SettingsDst -Encoding UTF8
    Write-Host "[OK] Merged $added new permissions into settings.local.json" -ForegroundColor Green
} else {
    Copy-Item -Path $SettingsTemplate -Destination $SettingsDst -Force
    Write-Host "[OK] Created settings.local.json from template" -ForegroundColor Green
}

# 4. Summary
Write-Host ""
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Skills:   $(@('meal-order').Length) installed"
Write-Host "  Config:   $SettingsDst"
$skillCount = (Get-ChildItem $SkillsDir -Filter '*.md' -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "  Total:    $skillCount skill(s) in .claude/skills/"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Claude Code (or /reload session)"
Write-Host "  2. Say: '帮我点午餐' to test the meal-order skill"
Write-Host "  3. Say: '开启饭点提醒' to enable cron reminders"
Write-Host ""
