Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\steve\.gemini\antigravity-ide\brain\06a3c12c-fe30-4876-8f19-758ac4e725b9\app_icon_1792881891736.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Image]::FromFile($srcPath)

$projectDir = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path (Join-Path $projectDir "assets") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $projectDir "build") | Out-Null

$assetsPng = Join-Path $projectDir "assets\icon.png"
$buildPng = Join-Path $projectDir "build\icon.png"
$assetsIco = Join-Path $projectDir "assets\icon.ico"
$buildIco = Join-Path $projectDir "build\icon.ico"

# Save 512x512 PNG
$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($bmp512)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, 512, 512)
$g.Dispose()

$bmp512.Save($assetsPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save($buildPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Dispose()

# Generate multi-size PNG streams for ICO
$sizes = @(256, 128, 64, 48, 32, 16)
$pngDataList = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $sz, $sz)
    $g.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngDataList += ,@($sz, $ms.ToArray())
    $ms.Dispose()
}

$src.Dispose()

# Assemble ICO container
$msIco = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($msIco)

# ICONDIR header (6 bytes)
$bw.Write([uint16]0)                  # Reserved
$bw.Write([uint16]1)                  # Type 1 = Icon
$bw.Write([uint16]$pngDataList.Count) # Number of images

# Calculate offset: header (6) + entries (16 * count)
$headerSize = 6 + ($pngDataList.Count * 16)
$currentOffset = $headerSize

# Directory entries
foreach ($item in $pngDataList) {
    $sz = $item[0]
    $data = $item[1]
    $w = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $h = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0)                # Colors
    $bw.Write([byte]0)                # Reserved
    $bw.Write([uint16]1)              # Planes
    $bw.Write([uint16]32)             # Bit count
    $bw.Write([uint32]$data.Length)   # Bytes in res
    $bw.Write([uint32]$currentOffset) # Image offset
    $currentOffset += $data.Length
}

# Write image data
foreach ($item in $pngDataList) {
    $bw.Write($item[1])
}

$bw.Flush()
$icoBytes = $msIco.ToArray()
[System.IO.File]::WriteAllBytes($assetsIco, $icoBytes)
[System.IO.File]::WriteAllBytes($buildIco, $icoBytes)
$bw.Dispose()
$msIco.Dispose()

Write-Host "Icons generated successfully at:"
Write-Host "  - $assetsIco"
Write-Host "  - $buildIco"
Write-Host "  - $assetsPng"
Write-Host "  - $buildPng"
