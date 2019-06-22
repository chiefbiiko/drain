# drain

Pull all data from `Deno.Reader`s and pass it to a simple `ondata` listener.

Kinda like `readableStream.on("data", listener)` in node.

[![Travis](http://img.shields.io/travis/chiefbiiko/drain.svg?style=flat)](http://travis-ci.org/chiefbiiko/drain) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/drain?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/drain)

## Usage

Call `drain` on a `Deno.Reader` to start pulling data. 
The `ondata` listener will be called with every chunk read from the reader.

``` ts
import { drain } from "https://denopkg.com/chiefbiiko/drain/mod.ts";

function ondata(chunk: Uint8Array): void {/* handle your data */}

// conn is a Deno.Reader - lets pretend top-level await landed
const conn: Deno.Conn = await Deno.dial("tcp", "419.0.0.1:41900");

// drain pulls forever/all data from the reader in its promises micro-thread
drain(conn, ondata).catch(console.error);
```

Useful for setting up *permanent* listeners, fx when wrapping a `Deno.Conn` with a custom connection type. Permanent since this module does not yet provide a  way to unregister the `ondata` listener.

## API

#### `drain(reader: Deno.Reader, ondata: (chunk: Uint8Array) => any): Promise<void>`

Pull all data from the `reader` and pass it to a simple `ondata` listener. Errors should be `catch`ed on the returned promise.

## License

[MIT](./LICENSE)