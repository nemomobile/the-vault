#!/usr/bin/python

tpl = '''
BEGIN:VCARD
VERSION:2.1
N:{name}
FN:{fname}
ORG:Bubba Gump Shrimp Co.
TITLE:Shrimp Man
TEL;WORK;VOICE:{wphone}
TEL;HOME;VOICE:{hphone}
ADR;WORK:;;100 Waters Edge;Baytown;LA;30314;United States of America
LABEL;WORK;ENCODING=QUOTED-PRINTABLE:100 Waters Edge=0D=0ABaytown, LA 30314=0D=0AUnited States of America
ADR;HOME:;;42 Plantation St.;Baytown;LA;30314;United States of America
LABEL;HOME;ENCODING=QUOTED-PRINTABLE:42 Plantation St.=0D=0ABaytown, LA 30314=0D=0AUnited States of America
EMAIL;PREF;INTERNET:{email}
REV:20080424T195243Z
END:VCARD
'''

def lines(fname):
    with open(fname) as f:
        return f.readlines()


files = ['emails.txt', 'names.txt', 'phones.txt']
emails, names, phones = [lines(f) for f in files]

from random import randrange

def vcard(name, emails, phones):
    email = emails[randrange(len(emails))]
    wp = phones[randrange(len(phones))]
    hp = phones[randrange(len(phones))]
    name, fname = name.split(' ')
    return tpl.format(email = email, wphone = wp, hphone = hp,
                      name = name, fname = fname)

def save(name, txt):
    fname = 'out/' + '_'.join(name.strip().split(' ')) + '.vcf'
    with open(fname, 'w') as f:
        f.write(txt)

[save(name, vcard(name, emails, phones)) for name in names]
