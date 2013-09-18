var assert = require('test');
var util = require('util');
var os = require('os');
var error = require('error');
var debug = require('debug');
var ps = require('subprocess');
//debug.level('debug');
var vault_config = require("vault/config");

var root = '/tmp/test-the-vault-unit';
var home = os.path(root, 'home');
var vault = os.path(root, 'vault');
var home_out = os.path(root, 'home_out');
var home_dirs;

var fixture = assert.fixture();

var mkdir;

fixture.addSetup(function() {
    var i;

    mkdir = function(p) {
        os.mkdir(p, { parent: true })
            || error.raise({msg: "Error creating", path: p});
    };

    mkdir(home);
    mkdir(home_out);
    mkdir(vault);

    fixture.addTeardown(function() {
        if (!fixture.is_failed)
            os.rmtree(root);
    });
    
    home_dirs = { data: os.path(home, "data"), bin: os.path(home, "bin") };
    home_dirs.each(function(t, path) {
        mkdir(path);
        var mk_path = os.path.curry(path);
        var dir_content = mk_path("content");
        mkdir(dir_content);
        mkdir(os.path(dir_content, "content_subdir"));
        for (i = 0; i < 3; ++i)
            os.write_file(os.path(dir_content, "a" + i), i);

        var dir_self = mk_path(".hidden_dir_self");
        mkdir(dir_self);
        for (i = 0; i < 4; ++i)
            os.write_file(os.path(dir_self, "b" + i), i);
        
        os.write_file(mk_path("file1"), "c1");
        var in_dir = mk_path("in_dir");
        mkdir(in_dir);
        os.write_file(os.path(in_dir, "file2"), "d2");

        var linked_dir = mk_path("linked_dir");
        mkdir(linked_dir);
        for (i = 0; i < 1; ++i)
            os.write_file(os.path(linked_dir, "e" + i), i);
        os.symlink("./linked_dir", mk_path("symlink_to_dir"));
    });
});

// fixture.addTestSetup(function() {
// });

fixture.addTest('export', function() {
    var out;
    var params = { "dir": vault, "bin-dir": vault
        , "home-dir": home, action: "export" };
    params = util.mapObject(params, function(k, v) {
        return [["--", k].join(""), v].join("=");
    });
    ps.check_output("./unit_all.js", params);
    out = ps.check_output("./check_dirs_similar.sh", [home, vault]).toString();
    out = util.filter(out.split("\n"), function(v) {
        return /^[<>]/.test(v);
    });
    var expected = ["< ./bin/symlink_to_dir", "< ./data/symlink_to_dir"
        , "> ./" + vault_config.prefix + ".links"
        , "> ./" + vault_config.prefix + ".unit.version"];
    assert.deepEqual(out, expected);
});

fixture.addTest('import', function() {
    var out, p;
    var params = { "dir": vault, "bin-dir": vault
        , "home-dir": home_out, action: "import" };
    params = util.mapObject(params, function(k, v) {
        return [["--", k].join(""), v].join("=");
    });
    ps.check_output("./unit_all.js", params);

    out = ps.check_output("./check_dirs_similar.sh", [home, home_out]).toString();
    out = util.filter(out.split("\n"), function(v) {
        return /^[<>]/.test(v);
    });
    assert.deepEqual(out, []);
});

fixture.addTest("import_v0", function() {
    var i, p, out;

    // prepare src
    var test_root = os.path(root, "import_v0");
    mkdir(test_root);
    var src = os.path(test_root, "src");
    mkdir(src);
    var dst = os.path(test_root, "dst");
    mkdir(dst);
    for (i = 0; i < 4; ++i)
        os.write_file(os.path(src, "v0" + i), i);

    // backup
    var params = { "dir": src, "bin-dir": src
        , "home-dir": dst, action: "import" };
    params = util.mapObject(params, function(k, v) {
        return [["--", k].join(""), v].join("=");
    });
    ps.check_output("./unit_all.js", params);
    out = ps.check_output("./check_dirs_similar.sh"
        , [os.path(test_root, "src")
           , os.path(test_root, "dst/bin/content")]).toString();
    out = util.filter(out.split("\n"), function(v) {
        return /^[<>]/.test(v);
    });
    assert.deepEqual(out, []);

    out = ps.check_output("./check_dirs_similar.sh"
        , [os.path(test_root, "src")
            , os.path(test_root, "dst/data/.hidden_dir_self")]).toString();
    out = util.filter(out.split("\n"), function(v) {
        return /^[<>]/.test(v);
    });
    assert.deepEqual(out, []);
    
});

fixture.execute();
