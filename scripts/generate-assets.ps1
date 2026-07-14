$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root 'build'
New-Item -ItemType Directory -Force -Path $build | Out-Null

function New-Canvas([int]$width, [int]$height) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @($bitmap, $graphics)
}

function Draw-HexMark($graphics, [float]$cx, [float]$cy, [float]$radius) {
  $points = New-Object 'System.Drawing.PointF[]' 6
  for ($i = 0; $i -lt 6; $i++) {
    $angle = ([Math]::PI / 3 * $i)
    $points[$i] = New-Object System.Drawing.PointF(($cx + [Math]::Cos($angle) * $radius), ($cy + [Math]::Sin($angle) * $radius))
  }
  $penGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 43, 214), 8)
  $penPink = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 43, 214), 2)
  $graphics.DrawPolygon($penGlow, $points)
  $graphics.DrawPolygon($penPink, $points)
  $inner = New-Object System.Drawing.RectangleF(($cx - $radius * .34), ($cy - $radius * .34), ($radius * .68), ($radius * .68))
  $penCyan = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 24, 232, 255), 2)
  $graphics.DrawEllipse($penCyan, $inner)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $graphics.FillEllipse($brush, ($cx - 3), ($cy - 3), 6, 6)
  $penGlow.Dispose(); $penPink.Dispose(); $penCyan.Dispose(); $brush.Dispose()
}

function Draw-Grid($graphics, [int]$width, [int]$height) {
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(25, 24, 232, 255), 1)
  for ($x = -$height; $x -lt $width + $height; $x += 24) { $graphics.DrawLine($pen, $x, $height, ($x + $height), 0) }
  for ($y = 0; $y -lt $height; $y += 22) { $graphics.DrawLine($pen, 0, $y, $width, $y) }
  $pen.Dispose()
}

function Save-Bmp($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
}

function New-Sidebar($path, [bool]$uninstall) {
  $canvas = New-Canvas 164 314; $bitmap = $canvas[0]; $graphics = $canvas[1]
  $graphics.Clear([System.Drawing.Color]::FromArgb(5, 2, 11)); Draw-Grid $graphics 164 314
  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 43, 214))
  $cyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 232, 255))
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 231, 255))
  $muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 117, 100, 132))
  $graphics.FillRectangle($pink, 0, 0, 4, 314)
  Draw-HexMark $graphics 82 79 39
  $title = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)
  $mono = New-Object System.Drawing.Font('Consolas', 6.5, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString('HACKERS', $title, $white, 23, 133)
  $graphics.DrawString('T E R M I N A L', $mono, $cyan, 39, 162)
  $graphics.DrawString($(if ($uninstall) { 'DISCONNECT SEQUENCE' } else { 'INSTALL SEQUENCE' }), $mono, $pink, 34, 238)
  $graphics.DrawString('HT-95 // SECURE LINK', $mono, $muted, 32, 277)
  Save-Bmp $bitmap $path
  $title.Dispose(); $mono.Dispose(); $pink.Dispose(); $cyan.Dispose(); $white.Dispose(); $muted.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

function New-Header($path) {
  $canvas = New-Canvas 150 57; $bitmap = $canvas[0]; $graphics = $canvas[1]
  $graphics.Clear([System.Drawing.Color]::FromArgb(5, 2, 11)); Draw-Grid $graphics 150 57
  Draw-HexMark $graphics 121 28 18
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 231, 255))
  $cyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 232, 255))
  $title = New-Object System.Drawing.Font('Arial', 10, [System.Drawing.FontStyle]::Bold)
  $mono = New-Object System.Drawing.Font('Consolas', 5.5, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString('HACKERS', $title, $white, 8, 13)
  $graphics.DrawString('SECURE INSTALL LINK', $mono, $cyan, 9, 33)
  Save-Bmp $bitmap $path
  $title.Dispose(); $mono.Dispose(); $white.Dispose(); $cyan.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

function New-Icon($path) {
  $canvas = New-Canvas 256 256; $bitmap = $canvas[0]; $graphics = $canvas[1]
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 5, 2, 11)); Draw-Grid $graphics 256 256
  Draw-HexMark $graphics 128 128 86
  $handle = $bitmap.GetHicon()
  $icon = [System.Drawing.Icon]::FromHandle($handle)
  $stream = [System.IO.File]::Create($path)
  $icon.Save($stream)
  $stream.Dispose(); $icon.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

New-Sidebar (Join-Path $build 'installerSidebar.bmp') $false
New-Sidebar (Join-Path $build 'uninstallerSidebar.bmp') $true
New-Header (Join-Path $build 'installerHeader.bmp')
New-Icon (Join-Path $build 'icon.ico')
Write-Host 'Generated installer artwork in' $build
