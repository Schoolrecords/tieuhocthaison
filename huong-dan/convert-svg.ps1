# Chuyển tất cả SVG trong assets/ thành PNG bằng Chrome headless
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$assets = "$PSScriptRoot\assets"

Get-ChildItem -Path $assets -Filter "*.svg" | ForEach-Object {
    $svg = $_.FullName
    $png = $_.FullName -replace '\.svg$', '.png'
    $svgUrl = "file:///" + ($svg -replace '\\','/')
    Write-Host "Converting $($_.Name) → PNG..."
    # SVG dimensions: 900x560 → render at 1.5x scale for better quality
    & $chrome --headless --disable-gpu --hide-scrollbars `
        --window-size=1350,840 `
        --force-device-scale-factor=1.5 `
        "--screenshot=$png" `
        $svgUrl 2>&1 | Out-Null
    if (Test-Path $png) {
        $size = (Get-Item $png).Length
        Write-Host "  ✓ $($_.BaseName).png ($size bytes)"
    } else {
        Write-Host "  ✗ FAILED: $($_.BaseName).png" -ForegroundColor Red
    }
}
Write-Host "`nDone."
