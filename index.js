var Stream = require('stream');
var crypto = require('crypto');
var murmur = require('murmur-hash-js');

var hashFns = {
  murmur: function(seed, key) {
    return murmur.murmur3(key, seed) % this.size;
  }
};

function CMM(width, depth, seed, hashType, streamOpts) {
  Stream.Writable.call(this, streamOpts);

  this.streamOpts = streamOpts;
  this.width = width || 10;
  this.depth = depth || 10;
  this.seed = seed || 42;
  this.computeConstants();
  this.registers = new Array(this.size);
  this.hashType = hashType || 'murmur';
  this.total = 0;

  this.setHashes();

  for (i = 0; i < this.registers.length; i++) {
    this.registers[i] = 0;
  }
}

CMM.prototype = Object.create(Stream.Writable.prototype);
CMM.prototype.constructor = CMM;

CMM.prototype.computeConstants = function() {
  this.size = this.width * this.depth;
  this.nextCounter = 0;
  this.nextLimit = 1000;
};

CMM.prototype.setHashes = function() {
  this.hash = hashFns[this.hashType] || this.cryptoHash;
  this.hashes = new Array(this.depth);

  for (i = 0; i < this.hashes.length; i++) {
    this.hashes[i] = this.hash.bind(this, this.seed + i);
  }
};

CMM.prototype.cryptoHash = function(seed, key) {
  if (!Buffer.isBuffer(key)) {
    key = new Buffer(key);
  }
  key = Buffer.concat([new Buffer([seed]), key]);
  return Math.abs(crypto.createHash(this.hashType).update(key).digest().readInt32LE(0, 4)) % this.width;
};

CMM.prototype._write = function(chunk, enc, next) {
  for (var i = 0; i < this.depth; i++) {
    this.registers[i * this.width + this.hashes[i](chunk)]++;
  }

  this.total++;

  if (next) {
    this.nextCounter = (this.nextCounter + 1) % this.nextLimit;
    if (this.nextCounter === 0) {
      setTimeout(next, 0);
    }
    else {
      next();
    }
  }

  return true;
};

CMM.prototype.frequency = function(value) {
  var results = new Array(this.depth);
  var counter;
  var error;

  for (var i = 0; i < this.depth; i++) {
    counter = this.registers[i * this.width + this.hashes[i](value)];
    error = (this.total - counter) / (this.width - 1);
    results[i] = counter - error;
  }

  return Math.round(results.sort()[Math.round(this.depth / 2)]);
};

CMM.prototype.export = function() {
  return {
    width: this.width,
    depth: this.depth,
    seed: this.seed,
    hashType: this.hashType,
    total: this.total,
    registers: this.registers.slice()
  };
};

CMM.prototype.import = function(data) {
  this.width = data.width;
  this.depth = data.depth;
  this.seed = data.seed;
  this.hashType = data.hashType;
  this.registers = data.registers.slice();
  this.total = data.total;
  this.computeConstants();
  this.setHashes();
};

CMM.prototype.merge = function(cmm) {
  if (cmm.width !== this.width) {
    throw Error('Widths of the Cmms must match.');
  }

  if (cmm.depth !== this.depth) {
    throw Error('Depths of the Cmms must match.');
  }

  if (cmm.seed !== this.seed) {
    throw Error('Seeds of the Cmms must match.');
  }

  if (cmm.hashType !== this.hashType) {
    throw Error('HashTypes of the Cmms must match.');
  }

  var result = new CMM(this.width, this.depth, this.seed, this.hashType, this.streamOpts);

  result.total = this.total + cmm.total;

  for (var i = 0; i < this.registers.length; i++) {
    result.registers[i] = this.registers[i] + cmm.registers[i];
  }

  return result;
};

module.exports = CMM;
