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
