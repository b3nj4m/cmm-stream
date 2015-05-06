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

  function frequencyTest(width, depth, numElements, elementType) {
    it('should count about ' + numElements + ' ' + elementType + ' using w:' + width + ', d:' + depth, function(done) {
      var c = new CMM(width, depth);
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

      c.on('finish', function() {
        var frequency = c.frequency(element);
        //TODO is there any reliable bound on the error?
        expect(frequency).to.be.a('number');

        totalError += Math.abs(frequency - numElements);
        totalAcceptableError += (2 * c.total) / width;
        totalTests++;

        done();
      });

      rs.pipe(c);
    });
  }
});
