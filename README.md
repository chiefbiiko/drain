# drain

Pull all data from `Deno.Reader`s and pass it to a simple `ondata` listener.

Kinda like `readableStream.on("data", listener)` in node.

[![Travis](http://img.shields.io/travis/chiefbiiko/drain.svg?style=flat)](http://travis-ci.org/chiefbiiko/drain) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/drain?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/drain)

# **WIP WIP WIP WIP**

## Usage

Call `drain` on a `Deno.Reader` to start pulling data. 
The `ondata` handler will be called with every chunk read from the reader.

``` ts
import { drain } from "https://denopkg.com/chiefbiiko/drain/mod.ts";

function ondata(chunk: Uint8Array): void {/* handle data */}
function onclose(): void {/* handle close */}
function onerror(err: Error): void {/* handle error */}

// conn is a Deno.Reader - lets pretend top-level await landed
const conn: Deno.Conn = await Deno.dial("tcp", "419.0.0.1:41900");

// drain pulls forever/all data from the reader in its promise's micro-thread
drain(conn, ondata).promise.then(onclose).catch(onerror);
```

## API

#### `drain(reader: Deno.Reader, ondata: (chunk: Uint8Array) => any): Drainage`

Pull all data from the `reader` and pass it to a simple `ondata` handler. The returned `Drainage` object exposes a promise property. To react to a `close` event register a then handler on that promise. Likewise, any read errors as well as those originating from the `ondata` handler will propagate to and can be `catch`ed on that promise. The `cancel` method of the `Drainage` interface allows to cancel (either resolve or reject) the corresponding promise.

#### `interface Drainage`

``` ts
export interface Drainage {
  promise: Promise<void>;
  cancel: (err?: Error) => void;
}
```

Calling `cancel` with an error, delegates to the `reject` callback; without an error `resolve` is invoked on the associated promise. 

## License

[MIT](./LICENSE)