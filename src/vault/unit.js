var sys = require("sys");

var getopt = function() {
    return sys.getopt({
        data_dir : { short_ : "d", long_ : "dir",
                     required : true, has_param : true},
        bin_dir : { short_ : "b", long_ : "bin-dir",
                    required : true, has_param : true},
        home : { short_ : "H", long_ : "home-dir",
                 required : true, has_param : true},
        action : { short_ : "a", long_ : "action",
                   required : true, has_param : true}
    }).parse(module.args).opts;
};

var config = function(vault_dir) {
    var register, unregister;
    if (vault_dir !== undefined) {
        var vault = require("vault/vault").use(vault_dir);
        register = vault.register;
        unregister = vault.unregister;
    } else {
        var cfg = require('vault/config');
        register = cfg.global.system().set;
        unregister = cfg.global.system().rm;
    }
    return Object.create({
        register : function(name, script) {
            register({name : name, script : script });
        },
        unregister : function(name) {
            unregister(name);
        }
    });
};

var execute = function(options, context) {
    var action = options.action;
    var src, dst;
    var os = require('os');
    var error = require('error');

    var export_all = function(get_target, vault_dir) {
        src = os.path(get_target(options.home), ".");
        if (!os.path.isdir(src))
            error.raise({msg : "Dir doesn't exist", dir : src});
        if (!os.path.isdir(vault_dir))
            error.raise({msg : "Dir doesn't exist", dir : vault_dir});
        os.cptree(src, vault_dir, {preserve: 'all'});
    };

    var import_all = function(get_target, vault_dir) {
        dst = os.path(get_target(options.home));
        if (!os.path.isdir(dst)) {
            if (!os.mkdir(dst))
                error.raise({msg: "Can't create directory", dir: dst});
        }
        if (!os.path.isdir(vault_dir))
            error.raise({msg : "Dir doesn't exist", dir : vault_dir});

        os.update_tree(os.path(vault_dir, '.'), dst, {preserve: 'all'});
    };

    var types = ['bin_dir', 'data_dir'];
    switch (action) {
        case 'export': {
            types.each(function(t) {
                if (t in context)
                    export_all(context[t], options[t]);
            });
            break;
        }
        case 'import': {
            types.each(function(t) {
                if (t in context)
                    import_all(context[t], options[t]);
            });
            break;
        }
        default: {
            error.raise({ msg : "Unknown action", action : action});
            break;
        }
    }
};

exports = Object.create({
    getopt : getopt,
    config : config,
    execute : execute
});
