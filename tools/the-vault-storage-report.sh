#!/bin/sh

function sep
{
    echo
    echo "@${@}@"
}


path=$HOME/.vault

if [ $# -ge 1 ]; then
    path=$1
fi

if ! [ -d $path ]; then
    echo "Have not found directory $path"
    exit 1
fi

exec 2>&1

sep df
df -h

sep mount
mount

sep "path${path}"
cd $path

sep du

du -sh .

sep "du:.git"
du -sh .git

if ! [ -d '.git' ]; then
    echo "Have not found $path/.git"
    exit 1
fi

function file_data
{
    fname=$1
    sep "file:$fname"
    if [ -f fname ]; then
        cat $fname
    fi
}

function status
{
    file_data .vault
    file_data .vault.state
    file_data .git/vault.version
    file_data .git/info/exclude
    sep "rev:$1"
    git rev-parse $1
    sep "log:$1"
    git log --pretty=oneline
    sep "ls::$1:$path"
    ls -al
    sep "symlinks:$1"
    find . -type l -exec ls -l {} \; -exec ls -lL {} \;
    sep "status:$1"
    git status
    sep "storage-version:$1:`cat .vault`"
    sep "ls:$1:.modules"
    ls -al .modules
    find .modules -name '*.json' -exec echo "@cat:$1:{}@" \; -exec cat {} \; -exec echo \;
}

sep version
version
sep rpm
rpm -qa | grep 'cutes\|vault'
sep config
cat .git/config
sep branch
git branch
sep fsck
git fsck --full --strict
sep reflog
git reflog
status HEAD
git checkout master
status master
echo



