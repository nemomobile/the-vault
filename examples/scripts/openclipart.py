#!/usr/bin/python

import sys, os, argparse, shutil

print "Backup script called"
print "with: {}".format(sys.argv)

parser = argparse.ArgumentParser()
parser.add_argument('-d', '--dir', dest='data', type=str, help='destination dir for text files')
parser.add_argument('-b', '--bin-dir', dest='bin', type=str, help='destination dir for blobs')
parser.add_argument('-H', '--home-dir', dest='home', type=str, help='home dir')
parser.add_argument('-a', '--action', dest='action',
                    help='Action to be performed: import, export, clear')


args = parser.parse_args()

if args.action == 'export':
    src = os.path.join(args.home, 'openclipart', 'text', '.')
    bin_src = os.path.join(args.home, 'openclipart', 'bin', '.')
    print "From:", src
    shutil.rmtree(args.data)
    shutil.copytree(src, args.data)
    print "From:", bin_src
    shutil.rmtree(args.bin)
    shutil.copytree(bin_src, args.bin)
else:
    print >>sys.stderr, "Action {} is not implemented".format(args.action)
    exit(1)

