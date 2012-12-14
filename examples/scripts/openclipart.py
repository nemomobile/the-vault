#!/usr/bin/python

import sys, os, argparse, shutil

print "Backup script called"
print "with: {}".format(sys.argv)
parser = argparse.ArgumentParser()
parser.add_argument('-d', '--dir', dest='data', type=str, help='destination dir for text files')
parser.add_argument('-b', '--bin-dir', dest='bin', type=str, help='destination dir for blobs')
parser.add_argument('-H', '--home-dir', dest='home', type=str, help='home dir')
args = parser.parse_args()
print os.getcwd(), args.home
src = os.path.join(args.home, 'openclipart', 'text', '.')
bin_src = os.path.join(args.home, 'openclipart', 'bin', '.')
print "From:", src
shutil.copytree(src, args.data)
print "From:", bin_src
shutil.copytree(bin_src, args.bin)

