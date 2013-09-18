var os = require("os.js");
var error = require("error.js");
var json_config = require('json_config');
var stat = require('vault/status');
var debug = require("debug");
var util = require("util");

var settings, unit_config, system_config, vault_config, global_config;

unit_config = function(data) {
    var that;
    var read = function(fname) {
        that.update(json_config.read(fname));
        return that;
    };
    var write = function(fname) {
        return json_config.write(that, fname);
    };
    var update = function(src) {
        var is_updated = false;
        if (!src.is_unit_config) {
            if (!(src.name && src.script))
                error.raise({
                    msg : "Unit description should contain"
                        + " name and script"});
            src.script = os.path.canonical(src.script);
        }
        src.each(function(n, v) {
            if (!(n in that) || v !== that[n]) {
                that[n] = v;
                is_updated = true;
            }
        });
        return is_updated;
    };

    that = Object.create({
        read : read,
        write : write,
        update : update,
        is_unit_config : true
    });
    if (data)
        update(data);

    return that;
};

system_config = function(settings) {
    var root = settings.units_dir;
    var that;
    var units = {};
    var ext = ".json";

    if (root === undefined)
        error.raise({msg : "Wrong configuration", cfg : settings});

    var path = function(name) { return os.path(root, name + ext); };

    var load = function() {
        units = {};
        if (!os.path.exists(root))
            return;

        var d = os.qt.dir(root);

        d.entryList(["*" + ext]).each(function(fname) {
            try {
                var data = unit_config().read(d.filePath(fname));
                units[data.name] = data;
            } catch (e) {
                debug.error("Loading config " + fname);
                debug.error(util.dump("Error", e));
            }
        });
    };

    var set = function(data) {
        var updated = false;
        data = unit_config(data);

        var name = data.name;
        var config_path = path(data.name);

        if (!os.path.exists(root)) {
            os.mkdir(root);
            units[name] = data;
            updated = true;
        } else if (name in units) {
            updated = units[name].update(data);
        } else if (os.path.exists(config_path)) {
            var actual = unit_config().read(config_path);
            updated = actual.update(data);
            units[name] = actual;
        } else {
            units[name] = data;
            updated = true;
        }

        return updated && units[name].write(config_path);
    };
    var rm = function(name) {
        var fname = path(name);
        if (!os.path.exists(fname))
            return null;
        os.rm(fname);
        return name + ext;
    };

    that = Object.create({
        set : set,
        rm: rm,
        units : function() { return units; },
        path : path,
        root : function() { return root; }
    });

    load();
    return that;
};

/**
 * load or initialize vault configuration describing
 * registered backup units. Configuration is read-only,
 * mutable() method returns object to modify it
 */
vault_config = function(vcs) {
    var root = vcs.root();
    var config_path = vcs.path('.modules');
    var base = system_config({units_dir: config_path.absolute});

    var that = Object.create(base);

    var status = vcs.status.curry(root.relative);

    that.set  = function(data) {
        if (!base.set(data))
            return false;

        vcs.add(config_path.relative, ['-A']);
        if (stat.is_dirty(status())) {
            vcs.commit("+" + data.name);
        }
        return true;
    };

    that.rm = function(name) {
        var fname = base.rm(name);
        if (!fname)
            return false;

        fname = config_path.path(fname);
        vcs.add(fname.relative, ['-u']);
        if (!stat.is_dirty(status()))
            error.raise({msg: "Logic error, can't rm vcs path"
                         , path : fname.relative});
        vcs.commit("-" + name);
        return true;
    };

    that.update = function(src) {
        var updated = false, units = that.units();
        src.each(function(n, v) {
            if (that.set(v))
                updated = true;
        });
        units.each(function(n, v) {
            if (!(n in src)) {
                that.rm(n) || error.raise({msg: n + " is not removed??" });
                updated = true;
            }
            return updated;
        });
    };

    return that;
};

settings = function() {
    var that = Object.create({
        system : function() { return system_config(that); },
        units : function() { return system_config(that).units(); }
    });
    that.units_dir = '/var/lib/the-vault';
    return that;
};

global_config = settings();

exports = Object.create({
    unit : unit_config,
    system : system_config,
    vault : vault_config,
    global : global_config,
    // prefix for configuration files
    prefix : ".f8b52b7481393a3e6ade051ecfb549fa"
})
