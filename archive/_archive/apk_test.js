var ApkReader = require('manifestparser/lib/apkreader');
new ApkReader('./node_modules/manifestparser/tests/fixtures/Snake.apk')
.on('manifest', function(manifest) {
    process.stdout.write(manifest);
}).on('error', function(err) {
    process.stdout.write(err.toString());
}).parse();