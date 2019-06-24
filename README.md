# drain

Pull all data from `Deno.Reader`s and pass it to a simple `ondata` listener.

Kinda like `readableStream.on("data", listener)` in node.

[![Travis](http://img.shields.io/travis/chiefbiiko/drain.svg?style=flat)](http://travis-ci.org/chiefbiiko/drain) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/drain?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/drain)

## Usage

Call `drain` on a `Deno.Reader` to start pulling data. 
The `ondata` handler will be called with every chunk read from the reader.

``` ts
import { drain } from "https://denopkg.com/chiefbiiko/drain/mod.ts";

function ondata(chunk: Uint8Array): void {/* handle data */}
function onerror(err: Error): void {/* handle error */}
function onclose(): void {/* handle close */}

// conn is a Deno.Reader - lets pretend top-level await landed
const conn: Deno.Conn = await Deno.dial("tcp", "419.0.0.1:41900");

// drain pulls forever/all data from the reader
const cancel = drain(conn, ondata, onerror, onclose);

// go about your business with all those handlers setup
// ..hack .. hack .. hack.. hack... ..... hack hack...
```

## API

#### `cancel = drain(reader, ondata[, onerror][, onclose][, options])`

Pull all data from the `reader` and pass it to a simple `ondata` handler.

``` ts
drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  onclose: () => any = (): void => undefined,
  { limit = Infinity, maxReadTimeout = Infinity }: DrainOptions = {}
): Cancel
```

The returned `cancel(err?: Error): void` function allows to stop reading. If it is invoked with an error the `onerror` handler is called with that error, otherwise the `onclose` handler gets invoked as reaction to the cancelation.

#### `type Cancel`

``` ts
export type Cancel = (err?: Error) => void;
```

## License

[MIT](./LICENSE)