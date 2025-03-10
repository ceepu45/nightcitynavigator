#!/bin/bash

file=$1

gpsbabel -i unicsv -f "$file" -x transform,trk=wpt -x nuketypes,waypoints -o gpx -F "${file%.csv}.gpx"
