<#
.SYNOPSIS
    Tự động push + redeploy Apps Script Web App cho TH Thái Sơn.

.DESCRIPTION
    Chạy script này từ thư mục dự án THThaiSon. Yêu cầu đã chạy `clasp login`
    và có sẵn `.clasp.json` với scriptId hợp lệ.

.PARAMETER Message
    Mô tả thay đổi cho version mới (mặc định lấy timestamp).

.PARAMETER InitDeploy
    Tạo deployment MỚI thay vì redeploy lên deployment hiện có.
    Chỉ dùng cho lần đầu hoặc khi muốn có URL mới (HIẾM KHI cần).

.EXAMPLE
    .\deploy-gas.ps1 -Message "Sửa logic xếp loại HTT"

.EXAMPLE
    .\deploy-gas.ps1 -InitDeploy -Message "Init v1 - TH Thái Sơn"
#>

param(
    [string]$Message = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$InitDeploy
)

$ErrorActionPreference = 'Stop'

# Sanity checks
if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
    Write-Host "❌ clasp chưa cài. Chạy: npm install -g @google/clasp" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path '.clasp.json')) {
    Write-Host "❌ Chưa có .clasp.json. Đọc DEPLOY_GAS.md Bước 3." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$env:USERPROFILE\.clasprc.json")) {
    Write-Host "❌ Chưa login. Chạy: clasp login" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Push Code.gs + appsscript.json..." -ForegroundColor Cyan
clasp push --force
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push thất bại"; exit 1 }

if ($InitDeploy) {
    Write-Host "📦 Tạo deployment mới: $Message" -ForegroundColor Cyan
    clasp deploy --description $Message
    Write-Host ""
    Write-Host "📌 Web App URL:" -ForegroundColor Yellow
    clasp list-deployments
    Write-Host ""
    Write-Host "👉 Copy URL '/exec' rồi paste cho Claude để tự replace placeholder." -ForegroundColor Yellow
} else {
    # Tìm deployment WEB APP hiện có — bỏ qua @HEAD (read-only test deployment)
    # `clasp list-deployments` xuất 1 dòng dạng:
    #   "- AKfyc...xxx @HEAD"   ← bỏ qua
    #   "- AKfyc...xxx @1 - description"  ← cần redeploy
    Write-Host "🔍 Tìm deployment Web App (bỏ qua @HEAD)..." -ForegroundColor Cyan
    $deps = clasp list-deployments 2>&1
    Write-Host $deps
    $line = $deps | Where-Object { $_ -match '- (AKfyc[\w-]+) @(?!HEAD)' } | Select-Object -First 1
    if (-not $line) {
        Write-Host "❌ Không tìm thấy deployment Web App (ngoài @HEAD). Chạy lần đầu với: .\deploy-gas.ps1 -InitDeploy" -ForegroundColor Red
        exit 1
    }
    if ($line -match '- (AKfyc[\w-]+) @') { $depId = $Matches[1] } else { Write-Host "❌ Không parse được deployment ID"; exit 1 }
    Write-Host "♻ Redeploy lên deployment: $depId" -ForegroundColor Cyan
    clasp redeploy $depId --description $Message
}

Write-Host ""
Write-Host "✅ Done." -ForegroundColor Green
