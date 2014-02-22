var fs = require('fs');

function* numbers() {
    var stuffIgot = [];
    for (var k = 0; k < 2; ++k) {        
        var itemReceived = yield k;
        stuffIgot.push(itemReceived);
    }
    console.log(stuffIgot);
}

var iterator = numbers();
// Cant give anything the first time: need to get to a yield first.
console.log(iterator.next()); // logs 0
console.log(iterator.next('present')); // logs 1
fs.readFile('file.txt', function(err, resultFromAnAsyncTask) {
    console.log(iterator.next(resultFromAnAsyncTask)); // logs 2
});