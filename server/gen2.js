var Promise = require("bluebird");

function delay(ms) {
    return new Promise(function(f){
        setTimeout(f, ms);
    });
}

function PingPong() {

}

PingPong.prototype.ping = Promise.coroutine(function* (val) {
    console.log("Ping?", val)
    yield delay(500)
    this.pong(val+1)
});

PingPong.prototype.pong = Promise.coroutine(function* (val) {
    console.log("Pong!", val)
    yield delay(500);
    this.ping(val+1)
});

var a = new PingPong();
a.ping(0);