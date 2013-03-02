#!/usr/bin/env cutes

qtscript.use("qt.core")
qtscript.load("util.js")
qtscript.load("sys.js")
qtscript.load("os.js")

print("Pictures backup: ", qtscript.script.args)

var cmdline = lib.sys.getopt({
    data_dir : { short_ : "d", long_ : "dir",
                 required : true, has_param : true},
    bin_dir : { short_ : "b", long_ : "bin-dir",
                required : true, has_param : true},
    home : { short_ : "H", long_ : "home-dir",
             required : true, has_param : true},
    action : { short_ : "a", long_ : "action",
               required : true, has_param : true}
}).parse(qtscript.script.args)

var options = cmdline.opts
var action = options.action;
var src, dst
var os = lib.os

switch (action) {
case 'export':
    print("EXPORT")
    src = lib.os.path(options.home, 'Pictures')
    os.cptree(src, options.bin_dir)
    break;
case 'import':
    print("IMPORT")
    dst = lib.os.path(options.home)
    os.update_tree(lib.os.path(options.bin_dir, 'Pictures'), dst)
    break;
default:
    throw lib.error({ msg : "Unknown action", action : action});
    break;
}
