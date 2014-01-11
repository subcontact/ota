var bplist = require('bplist-parser');

var plistFile = process.argv[2];

bplist.parseFile(plistFile, function(err, obj) {
  if (err) throw err;

  console.log(JSON.stringify(obj));
});