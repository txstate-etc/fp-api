Object.defineProperty(Array.prototype, "distinct", {
  value: function (cb) {
    return Object.keys(this.reduce(function(map, obj) {
      map[cb(obj)] = true;
      return map;
    }, {}));
  }
});

Object.defineProperty(Array.prototype, "hash_by_keyname", {
  value: function (keyname) {
    return this.reduce(function(map, obj) {
      map[obj[keyname]] = obj;
      return map;
    }, {});
  }
});

Object.defineProperty(Object.prototype, "emptyHash", {
  value: function () {
    return Object.getOwnPropertyNames(this).length == 0;
  }
});

RegExp.quote = function (str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
