function run(generator) {
  var iterator = generator(resume);
  var data = null, yielded = false;
  
  iterator.next();
  yielded = true;
  check();
  
  function check() {
    while (data && yielded) {
      var err = data[0], item = data[1];
      data = null;
      yielded = false;
      if (err) return iterator.throw(err);
      iterator.next(item);
      yielded = true;
    }
  }
  
  function resume() {
    data = arguments;
    check();
  }
}

function decr(x, callback) {
  return callback(null, x - 1);
}


run(function*(resume) {
  console.log("Hello");
  yield setTimeout(resume, 3000);
  console.log("World");
});

console.log(' 1 where am i?');

run(function*(resume) {

  console.log("Start");
  var x = 10000;
  while (x) {
    x = yield decr(x, resume);
  }
  console.log("Done");
});

console.log(' 2 where am i?');

run(function*(resume) {

  console.log("here?");
});

console.log(' 3 where am i?');