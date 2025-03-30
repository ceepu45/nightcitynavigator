param(
    [Parameter(Mandatory)]
    [string]$DllPath,
    [Parameter(Mandatory)]
    [string]$ArchiveName
)

if (-not (Test-Path $DllPath)) {
    Write-Error "DLL file does not exist"
    exit 2
}

if (Test-Path "dist\$ArchiveName") {
    Remove-Item -Recurse "dist\$ArchiveName"
}

if (Test-Path "dist\$ArchiveName.zip") {
    Remove-Item "dist\$ArchiveName.zip"
}

$pluginfolder = "dist\$ArchiveName\red4ext\plugins\nightcitynav"
New-Item -ItemType Directory -Path $pluginfolder

Copy-Item $DllPath -Destination $pluginfolder
Copy-Item ".\LICENSE" -Destination $pluginfolder

# Create an archive. Unlike the server, the root of the archive needs to correspond to the
# Cyberpunk 2077 game folder for mod installers to work.
Set-Location "dist\$ArchiveName"

$archive = "..\$ArchiveName.zip"
Compress-Archive -Path ".\*" -DestinationPath $archive

