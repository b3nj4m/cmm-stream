var Stream = require('stream');
var crypto = require('crypto');

function CMM(width, depth, hashType, streamOpts) {
  Stream.Writable.call(this, streamOpts);

  this.streamOpts = streamOpts;
  this.width = width || 10;
  this.depth = depth || 10;
  this.computeConstants();
  this.registers = new Array(this.size);
  this.hashType = hashType || 'whirlpool';
  this.total = 0;

  for (i = 0; i < this.registers.length; i++) {
    this.registers[i] = 0;
  }
}

CMM.prototype = Object.create(Stream.Writable.prototype);
CMM.prototype.constructor = CMM;

CMM.prototype.computeConstants = function() {
  this.size = this.width * this.depth;
};

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

CMM.prototype.export = function() {
  return {
    width: this.width,
    depth: this.depth,
    hashType: this.hashType,
    total: this.total,
    registers: this.registers.slice()
  };
};

CMM.prototype.import = function(data) {
  this.width = data.width;
  this.depth = data.depth;
  this.hashType = data.hashType;
  this.registers = data.registers.slice();
  this.total = data.total;
  this.computeConstants();
};

CMM.prototype.merge = function(cmm) {
  if (cmm.width !== this.width) {
    throw Error('Widths of the Cmms must match.');
  }

  if (cmm.depth !== this.depth) {
    throw Error('Depths of the Cmms must match.');
  }

  if (cmm.hashType !== this.hashType) {
    throw Error('HashTypes of the Cmms must match.');
  }

  var result = new CMM(cmm.width, cmm.depth, cmm.hashType, this.streamOpts);

  result.total = this.total + cmm.total;

  for (var i = 0; i < this.registers.length; i++) {
    result.registers[i] = this.registers[i] + cmm.registers[i];
  }

  return result;
};

module.exports = CMM;
