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
    }).parse(qtscript.script.args);
};

var config = function(vault_dir) {
    var that = {};
    var vault = require("the-vault/vault")(vault_dir);
    that.register = function(name, script) {
        vault.register({name : name, script : script });
    };
    that.unregister = function(name) {
        vault.unregister(name);
    };
    return that;
};

var execute = function(context) {
    var options = getopt().opts;
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
        os.cptree(src, vault_dir);
    };

    var import_all = function(get_target, vault_dir) {
        dst = os.path(get_target(options.home), ".");
        if (!os.path.isdir(dst))
            error.raise({msg : "Dir doesn't exist", dir : dst});
        if (!os.path.isdir(vault_dir))
            error.raise({msg : "Dir doesn't exist", dir : vault_dir});
        os.update_tree(options.bin_dir, dst);
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
