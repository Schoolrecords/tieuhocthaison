# v5 (2026-05-09): Composite block approach
# - Mỗi template inject 2 PNG placeholder (sig_block_ht.png, sig_block_gvcn.png)
# - Render-time FE composite dấu+chữ ký thành 1 PNG khối, post-process thay bytes
# - Cuối năm: replace paragraph {hieu_truong}\t{gvcn} bằng paragraph có drawing+tab+drawing+br+tên+tab+tên
# - Bìa lop1: insert paragraph drawing block_ht TRƯỚC paragraph {hieu_truong}

$ErrorActionPreference = 'Stop'
$root   = 'D:\XebatcheoTrT\1\EduTech_ChungTran\Code\HoSoSo_TH\THThaiSon_DoLuong\templates-hocba'
$backup = "$root\_backup-pre-signature-2026-05-09"
$work   = "$env:TEMP\hocba-build-v5"

# PNG 1x1 transparent
$pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
$pngBytes = [Convert]::FromBase64String($pngB64)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# EMU per cm = 360000
function EMU($cm){ [int]($cm * 360000) }

# Build inline drawing XML
function NewDrawing($embedId, $cxEMU, $cyEMU, $picId, $picName){
  $a = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
  $p = 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
  return '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + $cxEMU + '" cy="' + $cyEMU + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + $picId + '" name="' + $picName + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks ' + $a + ' noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic ' + $a + '><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic ' + $p + '><pic:nvPicPr><pic:cNvPr id="' + $picId + '" name="' + $picName + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + $embedId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + $cxEMU + '" cy="' + $cyEMU + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
}

# Khối HT: 5cm rộng × 4cm cao (dấu+chữ ký chồng nhau, tên KHÔNG kèm)
# Khối GVCN: 5cm rộng × 2cm cao (chỉ chữ ký, tên KHÔNG kèm)
$drawHT   = NewDrawing 'rIdSigBlockHt'   (EMU 5) (EMU 4) 100 'sig_block_ht'
$drawGVCN = NewDrawing 'rIdSigBlockGvcn' (EMU 5) (EMU 2) 101 'sig_block_gvcn'

# Paragraph mới thay {hieu_truong}\t{gvcn} cuối năm
# Ind left=1123, tab pos=5999 (giữ nguyên cấu trúc paragraph cũ)
$newFooterPara = '<w:p w14:paraId="55510001" w14:textId="55510001" w:rsidR="00E82814" w:rsidRDefault="00000000"><w:pPr><w:pStyle w:val="ThnVnban"/><w:tabs><w:tab w:val="left" w:pos="5999"/></w:tabs><w:ind w:left="1123"/><w:jc w:val="left"/></w:pPr>' +
                 '<w:r>' + $drawHT + '</w:r>' +
                 '<w:r><w:tab/></w:r>' +
                 '<w:r>' + $drawGVCN + '</w:r>' +
                 '<w:r><w:br/></w:r>' +
                 '<w:r><w:t xml:space="preserve">{hieu_truong}</w:t></w:r>' +
                 '<w:r><w:tab/></w:r>' +
                 '<w:r><w:t xml:space="preserve">{gvcn}</w:t></w:r>' +
                 '</w:p>'

# Paragraph drawing block_ht cho BÌA lop1 (centered, ind 3012 right 25 — match {hieu_truong} para)
$biaDrawPara = '<w:p w14:paraId="55510002" w14:textId="55510002" w:rsidR="002B2965" w:rsidRDefault="00703790"><w:pPr><w:ind w:left="3012" w:right="25"/><w:jc w:val="center"/></w:pPr>' +
               '<w:r>' + $drawHT + '</w:r>' +
               '</w:p>'

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item $work -ItemType Directory | Out-Null

foreach ($n in 1..5) {
  Write-Output ("=== Lop" + $n + " ===")
  $srcDocx = "$backup\Mau-HocBa-Lop$n.docx"
  $dstDocx = "$root\Mau-HocBa-Lop$n.docx"
  $unpacked = "$work\lop$n"
  Expand-Archive $srcDocx $unpacked -Force

  # 1. Add 2 PNG
  if (-not (Test-Path "$unpacked\word\media")) { New-Item "$unpacked\word\media" -ItemType Directory | Out-Null }
  [IO.File]::WriteAllBytes("$unpacked\word\media\sig_block_ht.png", $pngBytes)
  [IO.File]::WriteAllBytes("$unpacked\word\media\sig_block_gvcn.png", $pngBytes)

  # 2. Update relationships
  $relsPath = "$unpacked\word\_rels\document.xml.rels"
  $rels = [IO.File]::ReadAllText($relsPath)
  $newRels = '<Relationship Id="rIdSigBlockHt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/sig_block_ht.png"/>' +
             '<Relationship Id="rIdSigBlockGvcn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/sig_block_gvcn.png"/>'
  $rels = $rels -replace '</Relationships>', ($newRels + '</Relationships>')
  [IO.File]::WriteAllText($relsPath, $rels, [Text.Encoding]::UTF8)

  # 3. Update document.xml
  $docPath = "$unpacked\word\document.xml"
  $doc = [IO.File]::ReadAllText($docPath)

  # 3a. Cuối năm: replace paragraph chứa CẢ {hieu_truong} và {gvcn}
  # Pattern: <w:p ...>...{hieu_truong}...{gvcn}...</w:p> (single line, không greedy)
  $patFooter = '<w:p\b[^>]*>(?:(?!<w:p\b).)*?\{hieu_truong\}(?:(?!<w:p\b).)*?\{gvcn\}(?:(?!<w:p\b).)*?</w:p>'
  $matchesFooter = [regex]::Matches($doc, $patFooter)
  Write-Output ("  Footer match (HT+GVCN cùng paragraph): " + $matchesFooter.Count)
  if ($matchesFooter.Count -ne 1) {
    throw "Lop$n footer pattern không match đúng 1 lần"
  }
  $matchFooter = [regex]::Match($doc, $patFooter)
  $doc = $doc.Substring(0, $matchFooter.Index) + $newFooterPara + $doc.Substring($matchFooter.Index + $matchFooter.Length)

  # 3b. Bìa lop1: tìm paragraph chứa CHỈ {hieu_truong} (không có {gvcn})
  if ($n -eq 1) {
    $patBia = '<w:p\b[^>]*>(?:(?!<w:p\b).)*?\{hieu_truong\}(?:(?!<w:p\b).)*?</w:p>'
    $allBia = [regex]::Matches($doc, $patBia)
    $aloneBia = @($allBia | Where-Object { $_.Value -notmatch '\{gvcn\}' })
    Write-Output ("  Bia match (HT alone, no GVCN): " + $aloneBia.Count)
    if ($aloneBia.Count -ne 1) {
      throw "Lop1 bia pattern không match đúng 1 lần"
    }
    $matchBia = $aloneBia[0]
    $doc = $doc.Substring(0, $matchBia.Index) + $biaDrawPara + $doc.Substring($matchBia.Index)
  }

  [IO.File]::WriteAllText($docPath, $doc, [Text.Encoding]::UTF8)

  # 4. Repack docx
  if (Test-Path $dstDocx) { Remove-Item $dstDocx -Force }
  [IO.Compression.ZipFile]::CreateFromDirectory($unpacked, $dstDocx)

  $finalSize = (Get-Item $dstDocx).Length
  Write-Output ("  -> $dstDocx ($finalSize bytes)")
}

Write-Output ''
Write-Output 'Done v5.'
