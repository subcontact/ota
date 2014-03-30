
/**
 * Module dependencies.
 */

var assert = require('assert');
var debug = require('debug')('koa-static');
var send = require('koa-send');

/**
 * Expose `serve()`.
 */

module.exports = serve;

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve(ctx, root, opts) {
  opts = opts || {};

  assert(root, 'root directory is required to serve files');

  // options
  debug('static "%s" %j', root, opts);
  opts.root = root;
  opts.index = opts.index || 'index.html';

  if (!opts.defer) {
    return function *(next){

      file = this.path.replace(/^\/?[^\/]+\//,"");
      if (file.length===0) {file = "/";}

      //console.log('serve ', this.path);
      //console.log('serve ', file);
      if (this.idempotent && (yield send(this, file, opts))) return;
      yield next;
    }
  }

  return function *(next){
    yield next;

    // response is already handled
    if (!this.idempotent || this.body != null || this.status != null) return;

    file = this.path.replace(/^\/?[^\/]+\//,"");
    if (file.length===0) {file = "/";}
    
    yield send(this, file, opts);
  }
}