var util = require('util');

var is_tree_dirty = function(status) {
    return util.first(status, function(item) {
        return !item.isTreeClean();
    }) < status.length;
};

var is_dirty = function(status) {
    return util.first(status, function(item) {
        return !item.isClean();
    }) < status.length;
};

exports = Object.create({
    is_tree_dirty: is_tree_dirty,
    is_dirty: is_dirty
})
