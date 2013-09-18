var sys = require("sys");
var util = require("util");
var vault_config = require("vault/config");
var debug = require("debug");

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
        var cfg = vault_config;
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

var current_version = 1;

var execute = function(options, context) {
    var os = require('os');
    var error = require('error');
    var json = require("json_config");

    var action, actions;
    var src, dst;

    var vault_bin_dir = options.bin_dir,
        vault_data_dir = options.data_dir,
        home = os.path.canonical(options.home);

    var vault_dir = { bin : options.bin_dir, data : options.data_dir };
    var get_root_vault_dir, read_links, write_links;
    var is_proper_export_entry, entry_checks;
    var to_vault, from_vault;
    var get_link_info_fname = function(root) {
        return os.path(root, vault_config.prefix + ".links");
    };
    var version = function(root) {
        var fname = os.path(root, vault_config.prefix + ".unit.version");
        return {
            get : function() {
                return os.path.exists(fname) ? os.read_file(fname).toString() : 0;
            },
            save : function() {
                os.write_file(fname, 1);
            }};
    };

    get_root_vault_dir = function(data_type) {
        var res = vault_dir[data_type];
        if (!res)
            error.raise({ msg : "Unknown data type is unknown", data_type : data_type});
        if (!os.path.isDir(res))
            error.raise({ msg : "Vault dir doesn't exist?", dir : res });
        return res;
    };

    read_links = function(root_dir) {
        return json.read(get_link_info_fname(root_dir));
    };

    write_links = function(links, root_dir) {
        return json.write(links, get_link_info_fname(root_dir));
    };


    to_vault = function(data_type, paths) {
        var dst_root = get_root_vault_dir(data_type);
        var link_info_path = get_link_info_fname(dst_root);

        var links = (function() {
            var data = read_links(dst_root);
            return Object.create({
                add : function(info) {
                    data = data || {};
                    data[info.path] = { target: info.target
                                        , target_path: info.target_path };
                },
                save : function() {
                    if (data)
                        write_links(data, dst_root);
                }
            });
        })();

        var process_symlinks = function(v) {
            if (!os.path.isSymLink(v.full_path))
                return;

            if (!os.path.isDescendent(v.full_path, v.root_path)) {
                if (v.required)
                    error.raise({ msg: "Required path does not belong to its root dir"
                                  , path: v.full_path });
                v.skip = true;
                return;
            }

            // separate link and deref destination
            var tgt = os.path.deref(v.full_path);
            var tgt_path = os.path.relative(os.path.canonical(tgt), home);

            var res = Object.create(v);
            res.full_path = v.full_path;
            res.path = v.path;
            res.is_symlink = true;
            res.target = tgt;
            res.target_path = tgt_path;
            links.add(res);

            v.full_path = tgt;
            v.path = tgt_path;
        };

        var is_src_exists = function(info) {
            if (info.skip)
                return false;

            if (!os.path.exists(info.full_path)) {
                if (info.required)
                    error.raise({ msg: "Required path does not exist"
                                  , path: info.full_path });
                return false;
            }
            return true;
        };

        var copy_entry = function(info) {
            var dst = os.path.dirName(os.path(dst_root, info.path));
            var src = info.full_path;

            if (!(os.path.isDir(dst) || os.mkdir(dst, { parent: true })))
                error.raise({ msg: "Can't create destination in vault"
                              , path: dst});
            if (os.path.isDir(src)) {
                os.update_tree(src, dst, {preserve: 'all'});
            } else if (os.path.isFile(src)) {
                os.cp(src, dst, {update: true, preserve: 'all'});
            } else {
                error.raise({msg: "No handler for this entry type"
                             , path: src});
            }
        };

        paths.each(process_symlinks);
        paths = util.filter(paths, is_src_exists);
        paths.each(copy_entry);
        links.save();
        version(dst_root).save();
    };

    from_vault = function(data_type, items) {
        var src_root, links, create_dst_dirs, fallback_v0;
        var linked_items = [];

        fallback_v0 = function() {
            var dst, src;
            debug.warning("Restoring from old unit version");
            // during migration from initial format old (and single)
            // item is going first
            dst = os.path(items[0].full_path);
            if (!os.path.isdir(dst)) {
                if (!os.mkdir(dst))
                    error.raise({msg: "Can't create directory", dir: dst});
            }
            os.update_tree(os.path(src_root, '.'), dst, {preserve: 'all'});
        };

        create_dst_dirs = function(item) {
            var path = item.full_path;
            if (!os.path.isDir(item.src))
                path = os.path.dirName(path);

            var res = os.path.isDir(path) || os.mkdir(path, {parent: true});
            if (!res && item.required)
                error.raise({msg: "Can't recreate tree to required item", path: item.path
                             , dst_dir: path});
        };

        var process_absent_and_links = function(item) {
            var src = os.path(src_root, item.path);
            if (os.path.exists(src)) {
                item.src = src;
                return undefined;
            }
            var link = links.get(item);
            item.skip = true;

            if (!link) {
                if (item.required)
                    error.raise({msg: "No required source item", path: src
                                 , path: link.path });
                return undefined;
            }

            var linked = Object.create(item);
            linked.path = link.target_path;
            linked.full_path = os.path(item.root_path, link.target_path);
            src = os.path(src_root, linked.path);
            if (os.path.exists(src)) {
                linked.src = src;
                linked.skip = false;
                link.create_link();
                return linked;
            } else if (item.required) {
                error.raise({msg: "No linked source item", path: src
                             , link: link.path, target: linked.path });
            }
            return undefined;
        };

        src_root = get_root_vault_dir(data_type);

        var v = version(src_root).get();
        if (v > current_version) {
            error.raise({msg: "Can't restore from newer unit version, upgrade the-vault"
                        , expected: current_version, actual: v});
        } else if (v < current_version) {
            return fallback_v0();
        }

        links = (function() {
            var data = read_links(src_root) || {};
            return Object.create({
                get : function(info) {
                    var paths = data[info.path];
                    if (paths === undefined)
                        return undefined;
                    var res = Object.create(paths);
                    res.create_link = function() {
                        create_dst_dirs(info);
                        os.symlink(paths.target_path, info.full_path);
                    };
                    return res;
                }
            });
        })();

        linked_items = util.extract(items, process_absent_and_links);
        if (linked_items.length)
            items = items.concat(linked_items);

        items.each(function(item) {
            var src, dst;
            if (item.skip) return;

            // TODO process correctly self dir (copy with dir itself)
            create_dst_dirs(item);
            if (os.path.isDir(item.src)) {
                dst = os.path.dirName(os.path.canonical(item.full_path));
                src = os.path.canonical(item.src);
                os.update_tree(src, dst, {preserve: 'all'});
            } else if (os.path.isFile(item.src)) {
                dst = os.path.dirName(item.full_path);
                src = item.src
                os.cp(src, dst, {update: true, preserve: 'all'});
            }
        });
    };

    actions = {
        "export" : to_vault,
        "import" : from_vault
    };

    var get_home_path = function(item) {
        var res = Object.create(item);

        var path = item.path;
        if (typeof path != "string")
            error.raise({ msg : "Invalid data(path)"
                          , item : util.dump("ITEM", item, {proto: true})});

        res.full_path = os.path(home, path);
        res.root_path = home;
        return res;
    };

    var location_actions = {
        home : function(context_types) {
            context_types.each(function(data_type, items) {
                var paths = util.map(items, get_home_path);
                action(data_type, paths);
            });
        }
    };

    if (!os.path.isdir(vault_data_dir))
        error.raise({msg : "Vault data dir doesn't exist"
                     , dir : vault_data_dir});

    if (!os.path.isdir(vault_bin_dir))
        error.raise({msg : "Vault bin dir doesn't exist"
                     , dir : vault_bin_dir});

    if (!os.path.isdir(home))
        error.raise({msg : "Home dir doesn't exist"
                     , dir : home});

    action = actions[options.action];
    if (action == undefined)
        error.raise({ msg : "Unknown action", action : options.action});

    context.each(function(name, value) {
        var next = location_actions[name];
        if (!next)
            error.raise({ msg : "Unknown context item", item : name});
        next(value);
    });

};

exports = Object.create({
    getopt : getopt,
    config : config,
    execute : execute
});
