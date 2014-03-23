var cache = {}
function now() { return (new Date).getTime(); }

exports.set = function(key, value, time) {

	var expire = time + now();
	var record = {value: value, expire: expire};

	cache[key] = record;
}

exports.del = function(key) {
  delete cache[key];
}

exports.clear = function() {
  cache = {};
}

exports.get = function(key) {
  var data = cache[key];
  if (typeof data !== "undefined") {
    if (isNaN(data.expire) || data.expire >= now()) {
      return data.value;
    } else {
      exports.del(key);
    }
  }
  return null;
}

exports.size = function() { 
  var size = 0, key;
  for (key in cache) {
    if (cache.hasOwnProperty(key)) 
      if (exports.get(key) !== null)
        size++;
  }
  return size;
}

exports.memsize = function() { 
  var size = 0, key;
  for (key in cache) {
    if (cache.hasOwnProperty(key)) 
      size++;
  }
  return size;
}
