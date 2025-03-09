#!/usr/bin/env python

import struct
import argparse
import datetime
import time
from socket import *


parser = argparse.ArgumentParser()
parser.add_argument("x", type=float)
parser.add_argument("y", type=float)
parser.add_argument("z", type=float)
args = parser.parse_args()

def gen_object(args):
    now = datetime.datetime.now()
    timestamp = now.timestamp()
    seconds = int(timestamp)
    nanos = int((timestamp - seconds) * 1e9)
    loc_type = 0
    x = args.x
    y = args.y
    z = args.z
    return struct.pack("IIIfffffff", seconds, nanos, loc_type, x, y, z, 0, 0, 0, 0)

socket = socket(AF_INET, SOCK_DGRAM)
socket.settimeout(1)
addr = ("127.0.0.1", 52077)
while True:
    stream = gen_object(args)
    socket.sendto(stream,addr)
    time.sleep(0.5)


