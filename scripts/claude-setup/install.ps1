# EatOrNot Claude Code Skill Installer (PowerShell)
# Usage: .\scripts\claude-setup\install.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$SetupDir = Join-Path $ProjectRoot ".claude"
$SkillsDir = Join-Path $SetupDir "skills"

Write-Host "🍔 EatOrNot Claude Code Skill Installer" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot" -ForegroundColor Gray

# 1. Create .claude directories
if (-not (Test-Path $SkillsDir)) {
    New-Item -ItemType Directory -Path $SkillsDir -Force | Out-Null
    Write-Host "✅ Created $SkillsDir" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Skills dir already exists" -ForegroundColor Yellow
}

# 2. Copy skill file
$SkillSrc = Join-Path $PSScriptRoot "skills\meal-order.md"
$SkillDst = Join-Path $SkillsDir "meal-order.md"
if (Test-Path $SkillSrc) {
    Copy-Item -Path $SkillSrc -Destination $SkillDst -Force
    Write-Host "✅ Installed skill: meal-order" -ForegroundColor Green
} else {
    Write-Host "❌ Skill source not found: $SkillSrc" -ForegroundColor Red
    exit 1
}

# 3. Copy settings template (merge with existing if present)
$SettingsTemplate = Join-Path $PSScriptRoot "settings.local.json.template"
$SettingsDst = Join-Path $SetupDir "settings.local.json"

if (Test-Path $SettingsDst) {
    Write-Host "⚠️  settings.local.json already exists. Merge permissions manually if needed." -ForegroundColor Yellow
    Write-Host "   Template location: $SettingsTemplate" -ForegroundColor Gray
} else {
    Copy-Item -Path $SettingsTemplate -Destination $SettingsDst -Force
    Write-Host "✅ Created settings.local.json" -ForegroundColor Green
}

# 4. Verify
Write-Host ""
Write-Host "📋 Installation Summary:" -ForegroundColor Cyan
Write-Host "   Skills: $(Get-ChildItem $SkillsDir -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) installed"
Write-Host "   Config: $SettingsDst"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart Claude Code (or reload session)"
Write-Host "   2. Say: '帮我点午餐' to test the meal-order skill"
Write-Host "   3. Say: '开启饭点提醒' to enable cron reminders"
Write-Host ""
