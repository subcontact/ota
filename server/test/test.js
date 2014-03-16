var assert = require("assert");
var q = require('q');

var wait = function (ms) {
  return function (fn) {
    setTimeout(fn, ms);
  };
};

var giveme = function (value) {
  var deferred = q.defer();
  deferred.resolve(value);
  return deferred.promise;
};

describe('co-mocha', function () {

  it('should work synchronously', function () {
    assert.equal(1 + 1, 2);
  });

  it('should work with generators', function* () {
    assert(yield giveme(1 + 1), 3);
    //yield wait(100);
  });

  it('should work with with callbacks', function (done) {
    assert.equal(1 + 1, 2);
    wait(100)(done);
  });
});