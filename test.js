var expect = require('chai').expect;
var Stream = require('stream');
var CMM = require('./index');

describe('cmm', function() {
  describe('registers', function() {
    it('should have width * depth registers', function() {
      var c = new CMM(2, 2);
      expect(c.registers.length).to.be.equal(4);

      c = new CMM(3, 2);
      expect(c.registers.length).to.be.equal(6);

      c = new CMM(3, 3);
      expect(c.registers.length).to.be.equal(9);

      c = new CMM(4, 3);
      expect(c.registers.length).to.be.equal(12);
    });

    it('should have zeroed registers', function() {
      var c = new CMM(3, 3);
      for (var i = 0; i < c.registers.length; i++) {
        expect(c.registers[i]).to.be.equal(0);
      }
    });
  });

  describe('import/export', function() {
    it('should export', function(done) {
      makeCmm(10, 10, 10, 'whirlpool', 'buffers', function(cmm) {
        var data = cmm.export();
        expect(data.width).to.equal(cmm.width);
        expect(data.depth).to.equal(cmm.depth);
        expect(data.hashType).to.equal(cmm.hashType);
        expect(data.registers.length).to.equal(cmm.registers.length);
        expect(data.registers).not.to.equal(cmm.registers);
        done();
      });
    });
    it('should import exported data', function(done) {
      makeCmm(10, 10, 10, 'whirlpool', 'buffers', function(cmm, element) {
        var newCmm = new CMM();
        newCmm.import(cmm.export());
        expect(newCmm.width).to.equal(cmm.width);
        expect(newCmm.depth).to.equal(cmm.depth);
        expect(newCmm.size).to.equal(cmm.size);
        expect(newCmm.hashType).to.equal(cmm.hashType);
        expect(newCmm.registers.length).to.equal(cmm.registers.length);
        expect(newCmm.registers).not.to.equal(cmm.registers);
        expect(newCmm.frequency(element)).to.equal(cmm.frequency(element));
        done();
      });
    });
  });

  describe('merge', function() {
    it('should merge', function(done) {
      makeCmm(20, 20, 10, 'whirlpool', 'buffers', function(cmm1) {
        makeCmm(20, 20, 10, 'whirlpool', 'buffers', function(cmm2, element) {
          var cmm3 = cmm1.merge(cmm2);
          expect(cmm3.width).to.equal(cmm1.width);
          expect(cmm3.depth).to.equal(cmm1.depth);
          expect(cmm3.total).to.equal(cmm1.total + cmm2.total);
          expect(cmm3.hashType).to.equal(cmm1.hashType);
          expect(cmm3.registers.length).to.equal(cmm1.registers.length);
          expect(cmm3.registers).not.to.equal(cmm1.registers);
          expect(cmm3.registers).not.to.equal(cmm2.registers);
          expect(cmm3.frequency(element)).to.be.at.least(1);
          expect(Math.abs(20 - cmm3.frequency(element))).to.be.at.most(expectedError(cmm3.total, cmm3.width));
          done();
        });
      });
    });
  });

  var totalError = 0;
  var totalAcceptableError = 0;
  var totalTests = 0;

  describe('frequency', function() {
    for (var i = 2; i < 24; i++) {
      for (var j = 2; j < 24; j++) {
        frequencyTest(i, j, i + j, 'strings');
        frequencyTest(i, j, i + j, 'buffers');
      }
    }

    it('should have acceptable average error rate', function() {
      console.log('total error', totalError, 'total acceptable error', totalAcceptableError);
      console.log('average error', totalError / totalTests);
      expect(totalError).to.be.at.most(totalAcceptableError);
    });
  });

  function makeCmm(width, depth, numElements, hashType, elementType, callback) {
    var c = new CMM(width, depth, hashType);
    var rs = new Stream.Readable();
    var size = 10 * width * depth;
    var element = elementType === 'strings' ? '42' : new Buffer([0x42]);
    var i = 0;

    rs._read = function() {
      var pushed = true;
      var buf;

      while (pushed && i < numElements) {
        pushed = this.push(element);
        i++;
      }
      while (pushed && i < size) {
        buf = new Buffer(4);
        buf.writeInt32LE(i++);
        pushed = this.push(buf);
      }
      if (pushed && i === size) {
        this.push(null);
      }
    };

    c.on('finish', callback.bind(this, c, element));

    rs.pipe(c);

    return c;
  }

  function expectedError(total, width) {
    return (2 * total) / width;
  }

  function frequencyTest(width, depth, numElements, elementType) {
    it('should count about ' + numElements + ' ' + elementType + ' using w:' + width + ', d:' + depth, function(done) {
      makeCmm(width, depth, numElements, 'whirlpool', elementType, function(c, element) {
        var frequency = c.frequency(element);
        //TODO is there any reliable bound on the error?
        expect(frequency).to.be.a('number');
        expect(frequency).to.be.at.least(1);

        totalError += Math.abs(frequency - numElements);
        totalAcceptableError += expectedError(c.total, width);
        totalTests++;

        done();
      });
    });
  }
});
