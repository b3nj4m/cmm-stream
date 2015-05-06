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

  describe('frequency', function() {
    for (var i = 2; i < 24; i++) {
      for (var j = 2; j < 24; j++) {
        frequencyTest(i, j, i + j);
      }
    }
  });

  function frequencyTest(width, depth, numElements) {
    it('should count about ' + numElements + ' elements using w:' + width + ', d:' + depth, function(done) {
      var c = new CMM(width, depth);
      var rs = new Stream.Readable();
      var size = width * depth;
      var i = 0;

      rs._read = function() {
        var pushed = true;

        while (pushed && i < numElements) {
          pushed = this.push('42');
          i++;
        }
        while (pushed && i < size) {
          pushed = this.push((i++).toString());
        }
        if (pushed && i === size) {
          this.push(null);
        }
      };

      c.on('finish', function() {
        expect(Math.abs(c.frequency('42') - numElements)).to.be.below((2 * c.total) / width);
        done();
      });

      rs.pipe(c);
    });
  }
});
