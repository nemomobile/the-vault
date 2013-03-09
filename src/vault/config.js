var os = require("os.js");
var error = require("error.js");
var json_config = require('json_config');

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
        var d = os.qt.dir(root);

        d.entryList(["*" + ext]).each(function(fname) {
            var data = unit_config().read(d.filePath(fname));
            units[data.name] = data;
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
        os.rm(path(name));
    };

    load();
    that = Object.create({
        set : set,
        rm: rm,
        all : function() { return units; }
    });

    return that;
};

/**
 * load or initialize vault configuration describing
 * registered backup units. Configuration is read-only,
 * mutable() method returns object to modify it
 */
vault_config = function(vcs) {
    var path = vcs.root();
    var config_fname = ".config";
    var config_path = os.path(path, config_fname);
    var config, res;
    config = json_config.read(config_path) || {};
    var save = function() {
        return json_config.write(config, config_path);
    };

    res = {};

    res.units = function() { return config; };

    var is_update = function(actual, other) {
        var res = false;
        other.until(function(n, v) {
            return (!(n in actual) || v !== actual[n]);
        });
        return res;
    };

    /// create wrapper to change configuration
    res.mutable = function() {
        var that;
        var add  = function(data) {
            data = unit_config(data);

            var name = data.name;
            if (name in config && is_update(config[name], data))
                return false;

            config[name] = data;
            save();
            vcs.add(config_fname);
            vcs.commit("+" + name);
            return true;
        };
        var rm = function(name) {
            if (name && (name in config)) {
                delete config[name];
                save();
                vcs.rm(config_fname);
                vcs.commit("-" + name);
            } else {
                error.raise({
                    msg : "Can't delete non-existing unit",
                    name : name });
            }
        };

        that = Object.create({
            add : add,
            rm : rm
        });
        return that;
    };

    return res;
};

settings = function() {
    var that = Object.create({
        units : function() { return system_config(that); }
    });
    that.units_dir = '/var/lib/the-vault';
    return that;
};

global_config = settings();

exports = Object.create({
    unit : unit_config,
    system : system_config,
    vault : vault_config,
    global : global_config
})