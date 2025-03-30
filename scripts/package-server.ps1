param(
    [Parameter(Mandatory)]
    [string]$ExePath,
    [Parameter(Mandatory)]
    [string]$ArchiveName
)

if (-not (Test-Path $ExePath)) {
    Write-Error "Target file does not exist"
    exit 2
}

if (Test-Path "dist\$ArchiveName") {
    Remove-Item -Recurse "dist\$ArchiveName"
}

if (Test-Path "dist\$ArchiveName.zip") {
    Remove-Item "dist\$ArchiveName.zip"
}

$outpath = "dist\$ArchiveName\"
New-Item -ItemType Directory -Path "$outpath"
New-Item -ItemType Directory -Path "$outpath\client"

Copy-Item $ExePath -Destination $outpath
Copy-Item -Recurse "client\dist" -Destination "$outpath\client"

Set-Location ".\dist"

$archive = "..\$ArchiveName.zip"
Compress-Archive -Path "$ArchiveName" -DestinationPath "$ArchiveName.zip"
