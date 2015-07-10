##cmm-stream

A stream-based Count-mean-min sketch implementation. Pipe in some strings/buffers to get frequency estimation.

```javascript
var Cmm = require('cmm-stream');
var es = require('event-stream');
var fs = require('fs');

var c = new Cmm(20, 20);

fs.createReadStream('data.txt')
  .pipe(es.split())
  .pipe(c);

c.on('finish', function() {
  console.log(c.frequency('42'));
  console.log(c.frequency('13'));
});
```

### API

#### Cmm(width, depth, hashType, streamOpts)

Construct a new writable Cmm (extends [`Stream.Writable`](https://nodejs.org/api/stream.html#stream_class_stream_writable)).

* `width` - the width of the table. Higher values reduce the magnitude of the frequency error (default `10`).
* `depth` - the depth of the table. Higher values reduce the probability of large frequency error (default `10`).
* `seed` - the seed integer for the hash functions (default `42`).
* `hashType` - which hashing algorithm to use on the values. Can be `'murmur'` or any algorithm supported by [`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm) (default: `'murmur'`).
* `streamOpts` - the options to pass along to the stream constructor.
 
#### Cmm.frequency(value)

Compute the approximate frequency of `value`.

#### Cmm.export()

Export the Cmm data. Returns an object like:

```javascript
{
  width: 10,
  depth: 10,
  seed: 42,
  hashType: 'whirlpool',
  total: 100000,
  registers: [...]
}
```

#### Cmm.import(data)

Import a Cmm data object. Replaces existing data.

#### Cmm.merge(cmm)

Merge this Cmm with another Cmm, creating a new instance. `width`, `depth`, `seed`, and `hashType` must match between the two.

