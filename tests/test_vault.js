var assert = require('test');
var util = require('util');
var os = require('os');
var error = require('error');
var debug = require('debug');

var home = '/tmp/.test-the-vault';
var vault_dir = os.path(home, '.vault');
var global_mod_dir = os.path(home, '.units');
var vault;
var api;
var cfg;
var fixture = assert.fixture();

fixture.addSetup(function() {
    os.path.exists(home) && error.raise({dir : home, msg : "should not exist"});
    os.mkdir(home);
    fixture.addTeardown(function() {
        if (!fixture.is_failed)
            os.rmtree(home);
    });

    api = require('vault/vault');
    cfg = require('vault/config');
    cfg.global.units_dir = global_mod_dir;
    os.mkdir(global_mod_dir);
    vault = api.use(vault_dir);
});

fixture.execute({
    init : function() {
        var git_cfg = {"user.name" : "NAME", "user.email" : "email@domain.to"};
        vault.init(git_cfg);
        assert.ok(os.path.isdir(vault_dir), "Vault is created");
        assert.ok(vault.exists(), "Vault exists");
        assert.ok(!vault.is_invalid(), "Vault is invalid");
    },
    config_global : function() {
        var units, mod_count;

        api.execute({action : "register", global : true
                    , data : "name=unit1,group=group1,"
                           + "script=./unit_vault_test.js"});
        var unit1_fname = os.path(global_mod_dir, "unit1" + ".json");
        assert.ok(os.path.isfile(unit1_fname), "unit 1 global config");

        units = cfg.global.units().all();
        mod_count = 0;
        assert.ok('unit1' in units, "Unit in config");
        units.each(function(){ ++mod_count; })
        assert.equal(mod_count, 1, "One unit/member");

        api.execute({action : "register", global : true
                    , data : "name=unit2,group=group1,"
                           + "script=./unit_vault_test.js"});
        units = cfg.global.units().all();
        mod_count = 0;
        var unit2_fname = os.path(global_mod_dir, "unit2" + ".json");
        units.each(function(){ ++mod_count; })
        assert.ok('unit2' in units, "Unit2 in config");
        assert.equal(mod_count, 2, "One unit/member");
        assert.ok(os.path.isfile(unit1_fname), "unit 1 global config");

        api.execute({action : "unregister", global : true
                    , unit : "unit1"});
        assert.ok(!os.path.exists(unit1_fname), "global config is removed");
    }
});
