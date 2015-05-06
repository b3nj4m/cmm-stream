##cmm-stream

A stream-based Count-mean-min sketch implementation. Pipe in some strings/buffers to get frequency estimation.

```javascript
var c = new Cmm();

//...

myDataSource.pipe(c);

c.on('finish', function() {
  console.log(c.frequency('42'));
  console.log(c.frequency('13'));
});
```

### API

#### Cmm(width, depth, hashType, streamOpts)

Construct a new writable Cmm (extends [`Stream.Writable`](https://nodejs.org/api/stream.html#stream_class_stream_writable)).

* `width` - the width of the table. Higher values reduce the magnitude of the frequency error (default 10).
* `depth` - the depth of the table. Higher values reduce the probability of large frequency error (default 10).
* `hashType` - which hashing algorithm to use on the values. Can be any algorithm supported by [`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm) (default: `'whirlpool'`).
* `streamOpts` - the options to pass along to the stream constructor.
 
#### Hll.frequency(value)

Compute the approximate frequency of `value`.
