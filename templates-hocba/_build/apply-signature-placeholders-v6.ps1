# v6 (2026-05-09): GVCN-only approach
# - HT: thầy chèn dấu+chữ ký THỦ CÔNG vào template Word (1 lần per template)
# - GVCN: code thay bytes render-time (chữ ký khác theo lớp)
# - Template chỉ inject 1 placeholder PNG sig_chuky_gvcn.png + 1 rIdSigChukyGvcn
# - Vị trí inject: trong cột phải section 2-col, sau text "Giáo viên chủ nhiệm"+"(Ký và ghi rõ họ tên)"

$ErrorActionPreference = 'Stop'
$root   = 'D:\XebatcheoTrT\1\EduTech_ChungTran\Code\HoSoSo_TH\THThaiSon_DoLuong\templates-hocba'
$backup = "$root\_backup-pre-signature-2026-05-09"
$work   = "$env:TEMP\hocba-build-v6"

$pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
$pngBytes = [Convert]::FromBase64String($pngB64)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function EMU($cm){ [int]($cm * 360000) }

function NewDrawing($embedId, $cxEMU, $cyEMU, $picId, $picName){
  $a = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
  $p = 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
  return '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + $cxEMU + '" cy="' + $cyEMU + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + $picId + '" name="' + $picName + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks ' + $a + ' noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic ' + $a + '><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic ' + $p + '><pic:nvPicPr><pic:cNvPr id="' + $picId + '" name="' + $picName + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + $embedId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + $cxEMU + '" cy="' + $cyEMU + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
}

# Khối GVCN: chỉ chữ ký, ~5cm × 2cm
$drawGVCN = NewDrawing 'rIdSigChukyGvcn' (EMU 5) (EMU 2) 200 'sig_chuky_gvcn'

# Paragraph chứa drawing GVCN, centered (match style cột phải)
$gvcnPara = '<w:p w14:paraId="66610001" w14:textId="66610001" w:rsidR="00E82814" w:rsidRDefault="00000000"><w:pPr><w:spacing w:before="120"/><w:ind w:left="54" w:right="325"/><w:jc w:val="center"/></w:pPr>' +
            '<w:r>' + $drawGVCN + '</w:r>' +
            '</w:p>'

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item $work -ItemType Directory | Out-Null

foreach ($n in 1..5) {
  Write-Output ("=== Lop" + $n + " ===")
  $srcDocx = "$backup\Mau-HocBa-Lop$n.docx"
  $dstDocx = "$root\Mau-HocBa-Lop$n.docx"
  $unpacked = "$work\lop$n"
  Expand-Archive $srcDocx $unpacked -Force

  # 1. Add PNG placeholder
  if (-not (Test-Path "$unpacked\word\media")) { New-Item "$unpacked\word\media" -ItemType Directory | Out-Null }
  [IO.File]::WriteAllBytes("$unpacked\word\media\sig_chuky_gvcn.png", $pngBytes)

  # 2. Update relationships
  $relsPath = "$unpacked\word\_rels\document.xml.rels"
  $rels = [IO.File]::ReadAllText($relsPath)
  $newRel = '<Relationship Id="rIdSigChukyGvcn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/sig_chuky_gvcn.png"/>'
  $rels = $rels -replace '</Relationships>', ($newRel + '</Relationships>')
  [IO.File]::WriteAllText($relsPath, $rels, [Text.Encoding]::UTF8)

  # 3. Update document.xml: insert paragraph drawing GVCN TRƯỚC paragraph có sectPr cols=2
  $docPath = "$unpacked\word\document.xml"
  $doc = [IO.File]::ReadAllText($docPath)

  $idxCols = $doc.IndexOf('<w:cols w:num="2"')
  if ($idxCols -lt 0) { throw "Lop$n không tìm thấy <w:cols w:num='2'>" }

  $idxP = $doc.LastIndexOf('<w:p ', $idxCols)
  if ($idxP -lt 0) { throw "Lop$n không tìm thấy <w:p before <w:cols num=2>" }

  Write-Output ("  cols num=2 at " + $idxCols + ", paragraph wrapping at " + $idxP)
  $doc = $doc.Substring(0, $idxP) + $gvcnPara + $doc.Substring($idxP)

  [IO.File]::WriteAllText($docPath, $doc, [Text.Encoding]::UTF8)

  # 4. Repack
  if (Test-Path $dstDocx) { Remove-Item $dstDocx -Force }
  [IO.Compression.ZipFile]::CreateFromDirectory($unpacked, $dstDocx)

  $finalSize = (Get-Item $dstDocx).Length
  Write-Output ("  -> $dstDocx ($finalSize bytes)")
}

Write-Output ''
Write-Output 'Done v6.'
