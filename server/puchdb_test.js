"use strict";

var fs      = require('fs');
var path    = require('path');
var lodash  = require('lodash');
var util    = require('util');
var find    = require('findit');
var pouchdb = require('pouchdb');

var db = new pouchdb('todos');
var remoteCouch = false;


function addTodo(text, cb) {
  var todo = {
    _id: new Date().toISOString(),
    title: text,
    completed: false
  };
  db.put(todo, cb);function callback(err, result) {
    if (!err) {
      console.log('Successfully posted a todo!');
      console.log(result);
    }
  });
}

function showTodos() {
  db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    console.log(err);
    console.log(doc);
  });
}


addTodo("one two");
addTodo("three four");

showTodos();