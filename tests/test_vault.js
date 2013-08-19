var assert = require('test');
var util = require('util');
var os = require('os');
var error = require('error');
var debug = require('debug');

//debug.level('debug');

var home = '/tmp/.test-the-vault-431f7f8b665d3cc2a1a4a8c3c74ad5ff';
var vault_dir = os.path(home, '.vault');
var global_mod_dir = os.path(home, '.units');
var vault, api, cfg, unit;

var fixture = assert.fixture();

fixture.addSetup(function() {
    os.path.exists(home) && error.raise({dir : home, msg : "should not exist"});
    os.mkdir(home);
    fixture.addTeardown(function() {
        if (!fixture.is_failed)
            os.rmtree(home);
    });
});

fixture.addTestSetup(function() {
    api = require('vault/vault');
    cfg = require('vault/config');
    unit = require('vault/unit');

    cfg.global.units_dir = global_mod_dir;
    os.rmtree(global_mod_dir);
    os.mkdir(global_mod_dir);
    vault = api.use(vault_dir);
});

var register_unit = function(name, is_global) {
    var data = {action : "register"
               , data : "name=" + name
                      + ",group=group1,"
                      + "script=./" + name + "_vault_test.js"};
    if (is_global)
        data.global = true;
    else
        data.vault = vault_dir;
    return api.execute(data);
};

var vault_init = function() {
    var git_cfg = {"user.name" : "NAME", "user.email" : "email@domain.to"};
    vault.init(git_cfg);
    assert.ok(os.path.isdir(vault_dir), "Vault is created");
    assert.ok(vault.exists(), "Vault exists");
    assert.ok(!vault.is_invalid(), "Vault is invalid");
};

fixture.addTest('init', vault_init);

fixture.addTest('config_global', function() {
    var units, mod_count;

    register_unit('unit1', true);
    var unit1_fname = os.path(global_mod_dir, "unit1" + ".json");
    assert.ok(os.path.isfile(unit1_fname), "unit 1 global config");

    units = cfg.global.units();
    mod_count = 0;
    assert.ok('unit1' in units, "Unit in config");
    units.each(function(){ ++mod_count; })
        assert.equal(mod_count, 1, "One unit/member");


    register_unit('unit2', true);
    units = cfg.global.units();
    mod_count = 0;
    var unit2_fname = os.path(global_mod_dir, "unit2" + ".json");
    assert.ok(os.path.isfile(unit1_fname), "unit 1 global config");
    units.each(function(){ ++mod_count; })
        assert.ok('unit2' in units, "Unit2 in config");
    assert.equal(mod_count, 2, "One unit/member");
    assert.ok(os.path.isfile(unit1_fname), "unit 1 global config");

    api.execute({action : "unregister", global : true
                , unit : "unit1"});
    assert.ok(!os.path.exists(unit1_fname), "global config is removed");
});

fixture.addTest('config_local', function() {
    var units, mod_count
      , vault_config;

    register_unit('unit1', false);
    var config_dir = os.path(vault_dir, '.modules');
    var config = cfg.system({units_dir: config_dir});
    assert.ok(os.path.isfile(config.path('unit1')), "unit1 config file");
    vault_config = vault.config().units();
    assert.ok('unit1' in vault_config
             , util.dump('no unit1 in vault config', vault_config));

    api.execute({action : "unregister", vault : vault_dir
                , unit : "unit1"});
    vault_config = vault.config().units();
    assert.ok(!('unit1' in vault_config)
             , util.dump('no unit1 in vault config', vault_config));
});

fixture.addTest('config_unit', function() {
    var config = unit.config();
    config.register("unit1", "./unit1_vault_test.js");
    config = unit.config(vault_dir);
    config.register("unit2", "./unit2_vault_test.js");
});

fixture.addTest('config_update', function() {
    var vault_config;
    os.rmtree(home);
    os.mkdir(home);
    vault_init();
    register_unit('unit1', true);
    assert.ok('unit1' in cfg.global.units()
             , util.dump('no unit1 in global config', cfg.global.units()));

    register_unit('unit2', false);
    vault_config = vault.config().units();
    assert.ok('unit2' in vault_config
             , util.dump('no unit2 in vault config', vault_config));
    vault.config().update(cfg.global.units());

    vault_config = vault.config().units();
    assert.ok('unit1' in vault_config
             , util.dump('no unit1 in vault config', vault_config));
    assert.ok(!('unit2' in vault_config)
             , util.dump('unit2 should be removed from vault config'
                        , vault_config));
});

fixture.addTest('simple_blobs', function() {
    var vault_config;
    os.rmtree(home);
    os.mkdir(home);
    vault_init();
    register_unit('unit1', false);
    vault_config = vault.config().units();
    assert.ok('unit1' in vault_config
             , util.dump('no unit1 in vault config', vault_config));

    var unit1_dir = os.path(home, 'unit1');
    os.mkdir(unit1_dir);
    var unit1_blob = os.path(unit1_dir, 'blob1');
    os.write_file(unit1_blob, "1\n2\n3\n");
    assert.ok(os.path.isdir(unit1_dir), "unit1 is prepared")
    assert.ok(os.path.isfile(unit1_blob), "unit1 blob is prepared")

    var is_started = true, is_failed = false;
    vault.backup(home, {}, function(progress) {
        switch(progress.status) {
            case "fail":
            is_failed = true;
            break;
            case "begin":
            is_started = true;
            break;
            default:
            break;
        }
    });
    assert.ok(is_started, "backup was not started");
    assert.ok(!is_failed, "backup is failed");
    assert.ok(os.path.isdir(unit1_dir), "unit1 is still here");
    assert.ok(os.path.isfile(unit1_blob), "unit1 blob is still here");
    var unit1_vault = vault.unit_path('unit1');
    var unit1_vault_path = unit1_vault.bin().absolute;
    assert.ok(os.path.isdir(unit1_vault_path), "unit1 is in the vault");
    var unit1_vault_blob = os.path(unit1_vault_path, 'blob1');
    assert.ok(os.path.exists(unit1_vault_blob)
             , "unit1 blob1 is in the vault");
    assert.ok(os.path.isSymLink(unit1_vault_blob)
             , "unit1 blob1 is symlink");

});

fixture.execute();
