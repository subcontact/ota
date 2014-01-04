var express = require('express');
var galaxy = require('galaxy');
var fs = galaxy.star(require('fs'));

var app = express();
app.use(express.urlencoded());
app.use(express.json());

/*
app.param('collectionName', function(req, res, next, collectionName){
  req.collection = db.collection(collectionName)
  return next()
})
*/


function delay(cb) {

  setTimeout(function() {
    cb(null, "Delay Done");
  },5000);
}
var g_delay = galaxy.star(delay);

var data = [{ id: 1, name : "blah", timestamp : Date.now()},{ id: 2, name : "blah", timestamp : Date.now()},{ id: 3, name : "blah", timestamp : Date.now()},{ id: 4, name : "blah", timestamp : Date.now()} ]

app.get('/', function(req, res, next) {

  var delay_data = yield g_delay();
  res.send(delay_data);
})

app.get('/projects/:projectName', function(req, res, next) {
  //req.collection.find({},{limit:10, sort: [['_id',-1]]}).toArray(function(e, results){
    //if (e) return next(e)
    res.send(data);

  //})
});


app.get('/projects/:projectName/:id', function(req, res, next) {
  //req.collection.findOne({_id: req.collection.id(req.params.id)}, function(e, result){
  //  if (e) return next(e)

    res.send(data[1]);

 // })
});



app.listen(3000);