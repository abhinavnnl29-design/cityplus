# ==============================================================================
# ANPR Dataset Converter: Pascal VOC XML -> YOLO Format & OCR Manifest
# City Pulse OS - Automatic Number Plate Recognition Pipeline
# ==============================================================================

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "c:\Users\ADMIN\OneDrive\Desktop\city pulse\antigravity\archive.zip"
$outDir = "c:\Users\ADMIN\OneDrive\Desktop\city pulse\antigravity\dataset"

Write-Host "[ANPR PIPELINE] Starting ANPR Dataset Conversion..." -ForegroundColor Cyan

# Create Output Directory Structure
$trainImgDir = Join-Path $outDir "images\train"
$valImgDir = Join-Path $outDir "images\val"
$trainLblDir = Join-Path $outDir "labels\train"
$valLblDir = Join-Path $outDir "labels\val"

New-Item -ItemType Directory -Force -Path $trainImgDir | Out-Null
New-Item -ItemType Directory -Force -Path $valImgDir | Out-Null
New-Item -ItemType Directory -Force -Path $trainLblDir | Out-Null
New-Item -ItemType Directory -Force -Path $valLblDir | Out-Null

# Create data.yaml for YOLOv8/YOLO11 Training
$yamlContent = @"
path: $outDir
train: images/train
val: images/val

nc: 1
names: ['license_plate']
"@
Set-Content -Path (Join-Path $outDir "data.yaml") -Value $yamlContent

# Prepare CSV Manifest Header
$csvPath = Join-Path $outDir "plates_ocr_manifest.csv"
$csvHeader = "Filename,Folder,PlateText,StateCode,Width,Height,XMin,YMin,XMax,YMax,NormXCenter,NormYCenter,NormWidth,NormHeight,Split"
Set-Content -Path $csvPath -Value $csvHeader

$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

# Index matching images and xml files
$xmlEntries = $zip.Entries | Where-Object { $_.FullName -like "*.xml" }
Write-Host "[ANPR PIPELINE] Total XML Annotations Found: " $xmlEntries.Count -ForegroundColor Green

$processedCount = 0
$csvRows = New-Object System.Collections.Generic.List[string]

$random = New-Object System.Random(42)

foreach ($entry in $xmlEntries) {
    try {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()

        [xml]$xmlDoc = $xmlContent
        $width = [double]$xmlDoc.annotation.size.width
        $height = [double]$xmlDoc.annotation.size.height

        if ($width -le 0 -or $height -le 0) { continue }

        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name)
        $folder = $entry.FullName.Split('/')[0]

        # Determine state code if in State-wise_OLX
        $stateCode = "IND"
        $parts = $entry.FullName.Split('/')
        if ($parts.Count -gt 2 -and $parts[0] -eq "State-wise_OLX") {
            $stateCode = $parts[1]
        }

        # Determine Train/Val Split (80% Train, 20% Val)
        $isTrain = ($random.NextDouble() -lt 0.8)
        $targetImgDir = if ($isTrain) { $trainImgDir } else { $valImgDir }
        $targetLblDir = if ($isTrain) { $trainLblDir } else { $valLblDir }
        $splitName = if ($isTrain) { "train" } else { "val" }

        $yoloLines = @()

        foreach ($obj in $xmlDoc.annotation.object) {
            $plateText = $obj.name
            if ([string]::IsNullOrWhiteSpace($plateText)) { continue }

            $xmin = [double]$obj.bndbox.xmin
            $ymin = [double]$obj.bndbox.ymin
            $xmax = [double]$obj.bndbox.xmax
            $ymax = [double]$obj.bndbox.ymax

            # Calculate Normalized YOLO Bounding Box
            $xCenter = [Math]::Round(($xmin + $xmax) / (2.0 * $width), 6)
            $yCenter = [Math]::Round(($ymin + $ymax) / (2.0 * $height), 6)
            $wNorm = [Math]::Round(($xmax - $xmin) / (1.0 * $width), 6)
            $hNorm = [Math]::Round(($ymax - $ymin) / (1.0 * $height), 6)

            # Class 0: license_plate
            $yoloLines += "0 $xCenter $yCenter $wNorm $hNorm"

            # Add entry to CSV manifest
            $csvRows.Add("$baseName,$folder,$plateText,$stateCode,$width,$height,$xmin,$ymin,$xmax,$ymax,$xCenter,$yCenter,$wNorm,$hNorm,$splitName")
        }

        if ($yoloLines.Count -gt 0) {
            # Write Label File
            $lblFile = Join-Path $targetLblDir "$baseName.txt"
            Set-Content -Path $lblFile -Value ($yoloLines -join "`n")

            # Extract matching image file from Zip
            $imgEntry = $zip.Entries | Where-Object { 
                $_.FullName -ne $entry.FullName -and 
                ([System.IO.Path]::GetFileNameWithoutExtension($_.Name) -eq $baseName) -and 
                ($_.Name -like "*.jpg" -or $_.Name -like "*.png" -or $_.Name -like "*.jpeg")
            } | Select-Object -First 1

            if ($imgEntry) {
                $destImgPath = Join-Path $targetImgDir $imgEntry.Name
                if (-not (Test-Path $destImgPath)) {
                    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($imgEntry, $destImgPath, $true)
                }
            }

            $processedCount++
        }
    } catch {
        # Continue on single file error
    }
}

# Write CSV Manifest
Add-Content -Path $csvPath -Value ($csvRows -join "`n")

$zip.Dispose()

Write-Host "[ANPR PIPELINE] Conversion Completed Successfully!" -ForegroundColor Green
Write-Host " - Total Annotated Files Processed: $processedCount" -ForegroundColor Yellow
Write-Host " - Dataset Output Directory: $outDir" -ForegroundColor Yellow
Write-Host " - YOLO Config: $(Join-Path $outDir 'data.yaml')" -ForegroundColor Yellow
Write-Host " - OCR Manifest: $csvPath" -ForegroundColor Yellow
