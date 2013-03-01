#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: ${0} <vault-dir>"
    exit 1
fi

VROOT=$1
export OPTS="-V ${VROOT}"

rm -rf --one-file-system ${VROOT}
rm -rf --one-file-system /tmp/the-vault/src
cp -rf ${HOME}/src/mer/the-vault /tmp/
cd /tmp/the-vault/src
cmd="cutes vault-cli.js"
echo "INIT"
${cmd} ${OPTS} -a init -g "user.name=Happy Sailor,user.email=sailor@jolla.com"
echo "REG openclipart"
${cmd} ${OPTS} -a register --data=name=openclipart,group=media,script=../examples/scripts/openclipart.py
echo "REG contacts"
${cmd} ${OPTS} -a register --data=name=contacts,group=organizer,script=../examples/scripts/contacts.js
echo "BACK 1"
${cmd} ${OPTS} -a backup -H ../examples/data
echo "BACK 2"
${cmd} ${OPTS} -a backup -H ../examples/data2 -m "2nd backup"
echo "LIST"
${cmd} ${OPTS} -a list-snapshots
echo "RESTORE"
${cmd} ${OPTS} -a restore -H ../examples/data -t latest
