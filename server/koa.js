var koa = require('koa');
var app = koa();


function delay(cb) {

  setTimeout(function() {
    cb("Delay Done");
  },5000);
}

// x-response-time

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// logger

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});


app.get('/', function *() {

  var delay_data = yield delay();
  res.send(delay_data);
})


// response
/*
app.use(function *(){
  this.body = 'Hello World';
});
*/
app.listen(3000);