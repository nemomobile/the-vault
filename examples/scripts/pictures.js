#!/usr/bin/env cutes

var vault = require('vault/unit');
var os = require('os');

vault.execute({
    bin_dir : function(home) {
        return os.path(home, 'Pictures');
    }
});
