#!/usr/bin/env cutes

var context = require('vault_test_context');
var vault = require('vault/unit');
var os = require('os');

vault.execute({
    bin_dir : function(home) {
        return os.path(home, 'Picturee');
    }
});
