#!/usr/bin/env cutes

var vault = require('vault/unit');
var os = require('os');
// var debug= require('debug');
// debug.level('debug');

var info = {
    home : {
        data : [
            { path : 'data/.hidden_dir_self' },
            { path : 'data/content/.' },
            { path : 'data/file1' },
            { path : 'data/in_dir/file2' },
            { path : 'data/symlink_to_dir' }
        ],
        bin : [
            { path : 'bin/.hidden_dir_self' },
            { path : 'bin/content/.' },
            { path : 'bin/file1' },
            { path : 'bin/in_dir/file2' },
            { path : 'bin/symlink_to_dir' }
        ]
    }
};

vault.execute(vault.getopt(), info);
