var Stream = require('stream');
var crypto = require('crypto');

function CMM(width, depth, hashType, streamOpts) {
  Stream.Writable.call(this, streamOpts);

  this.width = width || 10;
  this.depth = depth || 10;
  this.size = this.width * this.depth;
  this.registers = new Array(this.size);
  this.hashType = hashType || 'whirlpool';
  this.total = 0;

  for (i = 0; i < this.registers.length; i++) {
    this.registers[i] = 0;
  }
}

CMM.prototype = Object.create(Stream.Writable.prototype);
CMM.prototype.constructor = CMM;

CMM.prototype.hash = function(value, idx) {
  var hash = crypto.createHash(this.hashType).update(value).digest();
  idx = Math.pow(idx, 7) % (hash.length - 4);
  return Math.abs(hash.readInt32LE(idx, idx + 4)) % this.width;
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
