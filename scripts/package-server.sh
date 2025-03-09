#!/bin/bash
# Package the server files for release. This assumes artifacts have already been built, including the html/javascript files

if [ $# -ne 3 ]; then
    echo "Usage: $0 <executable path> <output archive name> <archive type>" >&2
    exit 2
fi

target=$1
output=$2
archive_type=$3

if [ ! -f "$target" ]; then
    echo "Error: Target file does not exist: ${target}" >&2
    exit 2
fi

if [ "$archive_type" != "zip" ] && [ "$archive_type" != "tar" ]; then
    echo "Error: Invalid archive format: $archive_type" >&2
    exit 2
fi

if [ -e "dist/$output" ]; then
    rm -r "dist/$output"
fi

mkdir -p "dist/$output"
mkdir -p "dist/$output/client"

cp "$target" "dist/$output/" || exit 1
cp -r "client/dist" "dist/$output/client/" || exit 1

# Create an archive
cd "dist" || exit 1
if [ "$archive_type" == "zip" ]; then
    archive="./${output}.zip"
    rm -f "$archive"
    zip -r "$archive" "$output" || exit 1
elif [ "$archive_type" == "tar" ]; then
    archive="./${output}.tar.zst"
    rm -f "$archive"
    tar --zstd -cvf "$archive" "$output" || exit 1
fi
