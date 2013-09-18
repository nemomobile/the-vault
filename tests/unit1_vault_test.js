#!/usr/bin/env cutes

var vault = require('vault/unit');
var os = require('os');

var info = {
    home : {
        bin : [
            { path : 'unit1' }
        ]
    }
};

vault.execute(vault.getopt(), info);

