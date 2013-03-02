#!/usr/bin/env cutes

qtscript.use("qt.core")
qtscript.load("util.js")
qtscript.load("sys.js")
qtscript.load("os.js")


var context = require('vault_test_context');
var vault = require('the-vault/module');
var os = require('os');

vault.execute({
    bin_dir : function(home) {
        return os.path(home, 'Picturee');
    }
});
