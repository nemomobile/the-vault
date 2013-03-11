#!/usr/bin/env cutes

var vault = require('vault/unit');
var os = require('os');

var context = {
    bin_dir : function(home) {
        return os.path(home, 'Pictures');
    }
};

vault.execute(vault.getopt(), context);
