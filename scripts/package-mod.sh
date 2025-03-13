#!/bin/bash
# Package the mod files for release. This assumes the artifacts have already been built.

if [ $# -ne 2 ]; then
    echo "Usage: $0 <dll path> <output archive name>" >&2
    exit 2
fi

target=$1
output=$2

if [ ! -f "$target" ]; then
    echo "Error: Target file does not exist: ${target}" >&2
    exit 2
fi

if [ -e "dist/$output" ]; then
    rm -r "dist/$output"
fi

pluginfolder="dist/$output/red4ext/plugins/gpsserver"
mkdir -p "$pluginfolder"

cp "$target" "$pluginfolder/" || exit 1
cp "./LICENSE" "$pluginfolder/" || exit 1

# Create an archive. Unlike the server, the root of the archive needs to correspond to the
# Cyberpunk 2077 game folder for mod installers to work.
cd "dist/$output" || exit 1

archive="../${output}.zip"
rm -f "$archive"
zip -r "$archive" ./* || exit 1
