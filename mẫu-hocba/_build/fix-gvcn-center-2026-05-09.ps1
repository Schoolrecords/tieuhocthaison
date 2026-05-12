# 2026-05-09 lần 2: Bỏ <w:ind> khỏi paragraph chứa drawing GVCN để drawing center thật trong cột phải
# Old: <w:spacing w:before="240" w:after="240"/><w:ind w:left="54" w:right="325"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>
# New: <w:spacing w:before="240" w:after="240"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$root   = Split-Path $PSScriptRoot -Parent
$backup = Join-Path $root "_backup-pre-center-fix-2026-05-09"
if (-not (Test-Path $backup)) { New-Item -ItemType Directory -Path $backup | Out-Null }

$oldPattern = '<w:spacing w:before="240" w:after="240"/><w:ind w:left="54" w:right="325"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>'
$newPattern = '<w:spacing w:before="240" w:after="240"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>'

1..5 | ForEach-Object {
    $name = "Mau-HocBa-Lop$_.docx"
    $src  = Join-Path $root $name
    $bak  = Join-Path $backup $name

    Copy-Item $src $bak -Force
    Write-Host "Backup → $bak"

    $zip = [System.IO.Compression.ZipFile]::Open($src, [System.IO.Compression.ZipArchiveMode]::Update)
    try {
        $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        if (-not $entry) { throw "Không tìm thấy word/document.xml trong $name" }

        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml = $reader.ReadToEnd()
        $reader.Dispose()

        $hits = ([regex]::Matches($xml, [regex]::Escape($oldPattern))).Count
        if ($hits -eq 0) {
            Write-Host "  ! KHÔNG khớp pattern trong $name — skip"
            return
        }

        $xmlNew = $xml.Replace($oldPattern, $newPattern)
        Write-Host "  Replace $hits hit(s)"

        $entry.Delete()
        $newEntry = $zip.CreateEntry('word/document.xml', [System.IO.Compression.CompressionLevel]::Optimal)
        $writer = New-Object System.IO.StreamWriter($newEntry.Open())
        $writer.Write($xmlNew)
        $writer.Dispose()
    }
    finally {
        $zip.Dispose()
    }

    Write-Host "  ✓ $name updated"
}

Write-Host ""
Write-Host "✓ Done. Backup at: $backup"
