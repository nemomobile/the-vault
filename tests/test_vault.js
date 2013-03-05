var assert = require('test');
var util = require('util');
var os = require('os');
var error = require('error');
var debug = require('debug');

var home = '/tmp/.test-the-vault';
var vault_dir = os.path(home, '.vault');
var global_mod_dir = os.path(home, '.modules');
var vault;
var api;

var fixture = assert.fixture();

fixture.addSetup(function() {
    os.path.exists(home) && error.raise({dir : home, msg : "should not exist"});
    os.mkdir(home);
    fixture.addTeardown(function() {
        if (!fixture.is_failed)
            os.rmtree(home);
    });

    api = require('vault/vault');
    api.config.modules_dir = global_mod_dir;
    os.mkdir(global_mod_dir);
    vault = api.use(vault_dir);
});

fixture.execute({
    init : function() {
        var cfg = {"user.name" : "NAME", "user.email" : "email@domain.to"};
        vault.init(cfg);
        assert.ok(os.path.isdir(vault_dir), "Vault is created");
        assert.ok(vault.exists(), "Vault exists");
        assert.ok(!vault.is_invalid(), "Vault is invalid");
    },
    config_global : function() {
        api.execute({action : "register", global : true
                    , data : "name=module1,group=group1,"
                           + "script=./module_vault_test.js"});
        var module1_fname = os.path(global_mod_dir, "module1" + ".json");
        assert.ok(os.path.isfile(module1_fname), "module 1 global config");
        api.execute({action : "unregister", global : true
                    , module : "module1"});
        assert.ok(!os.path.exists(module1_fname), "global config is removed");
    }
});
