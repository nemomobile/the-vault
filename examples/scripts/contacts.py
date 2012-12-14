#!/usr/bin/python

import sys, os, argparse, shutil

print "Contacts backup script called"
print "with: {}".format(sys.argv)
parser = argparse.ArgumentParser()
parser.add_argument('-d', '--dir', dest='data', type=str, help='destination dir for text files')
parser.add_argument('-b', '--bin-dir', dest='bin', type=str, help='destination dir for blobs')
parser.add_argument('-H', '--home-dir', dest='home', type=str, help='home dir')
parser.add_argument('-a', '--action', dest='action',
                    help='Action to be performed: import, export, clear')

args = parser.parse_args()

if args.action == 'export':
    print os.getcwd(), args.home
    src = os.path.join(args.home, 'vcf', 'out', '.')
    print "From:", src
    shutil.copytree(src, args.data)
else:
    print "Action {} is not implemented".format(args.action)
    exit(1)

