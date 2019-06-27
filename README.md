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
// ..hack .. hack .. hack.. hack... (maybe call cancel)..... hack hack...
```

## API

#### `cancel = drain(reader, ondata[, onerror][, onclose][, options])`

Pull all data from the `reader` and pass it to a simple `ondata` handler.

``` ts
export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  onclose: () => any = (): void => undefined,
  { limit = Infinity }: DrainOptions = {}
): Cancel
```

The returned `cancel(err?: Error): void` function allows to stop reading. Once invoked any pending reads are awaited before invoking either the `onerror` or `onclose` handler. If `cancel` is invoked with an error the `onerror` handler is called with that error, otherwise the `onclose` handler gets invoked as reaction to the cancelation. Canceling is a bike-shed feature, fx if `reader` never resolves its `read` promises, the cancelation will never take place because we are blocking while awaiting the read promise.

The option's `limit` property can be used to cap the number of reads and likewise the number of the `ondata` handler invocations.

#### `interface DrainOptions`

``` ts
export interface DrainOptions {
  // max number of reads
  limit?: number;
}
```

#### `type Cancel`

``` ts
export type Cancel = (err?: Error) => void;
```

## License

[MIT](./LICENSE)
