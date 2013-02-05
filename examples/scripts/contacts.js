#!/usr/bin/env qtscript

qtscript.use("qt.core")
qtscript.load("util.js")
qtscript.load("sys.js")
qtscript.load("os.js")

print("CONTACTS backup: ", qtscript.script.args)

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
var my = lib.os.path(options.home, 'vcf', 'out', '.')
switch (action) {
case 'export':
    print("EXPORT")
    src = my
    os.cptree(src, options.data_dir)
    break;
case 'import':
    print("IMPORT")
    dst = my
    os.update_tree(options.data_dir, dst)
    break;
default:
    throw lib.error({ msg : "Unknown action", action : action});
    break;
}
