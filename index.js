var Stream = require('stream');
var crypto = require('crypto');

function CMM(width, depth, topSize, hashType, streamOpts) {
  Stream.Writable.call(this, streamOpts);

  this.width = width || 10;
  this.depth = depth || 10;
  this.topSize = topSize || 0;
  this.size = this.width * this.depth;
  this.registers = new Array(this.size);
  this.hashVector1 = new Array(this.depth);
  this.hashVector2 = new Array(this.depth);
  this.prime = Math.pow(2, 31) - 1;
  this.total = 0;

  for (var i = 0; i < this.depth; i++) {
    //TODO are randoms really necessary? would be nice to have some determinism
    this.hashVector1[i] = Math.round(Math.random() * this.prime);
    this.hashVector2[i] = Math.round(Math.random() * this.prime);
  }

  for (i = 0; i < this.registers.length; i++) {
    this.registers[i] = 0;
  }
}

CMM.prototype = Object.create(Stream.Writable.prototype);
CMM.prototype.constructor = CMM;

CMM.prototype.hash = function(value, idx) {
  return ((this.hashVector1[idx] * value + this.hashVector2[idx]) % this.prime) % this.width;
};

CMM.prototype.write = function(chunk, enc, next) {
  for (var i = 0; i < this.depth; i++) {
    this.registers[i * this.width + this.hash(chunk, i)]++;
  }

  this.total++;

  if (next) {
    next();
  }

  return true;
};

CMM.prototype.frequency = function(value) {
  var results = new Array(this.depth);
  var counter;
  var error;

  for (var i = 0; i < this.depth; i++) {
    counter = this.registers[i * this.width + this.hash(value, i)];
    error = (this.total - counter) / (this.width - 1);
    results[i] = counter - error;
  }

  return Math.round(results.sort()[Math.round(this.depth / 2)]);
};

module.exports = CMM;
