import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";
import {
  assert,
  assertEquals,
  fail
} from "https://deno.land/std/testing/asserts.ts";
import {
  encode,
  decode
} from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { Drainage, drain } from "./mod.ts";

test({
  name: "drains readers non-blocking",
  async fn(): Promise<void> {
    const listener: Deno.Listener = Deno.listen("tcp", "127.0.0.1:41900");

    listener.accept().then(
      async (conn: Deno.Conn): Promise<void> => {
        await conn.write(encode("419", "utf8"));
        conn.close();
        listener.close();
      }
    );

    const conn: Deno.Conn = await Deno.dial("tcp", "127.0.0.1:41900");

    let dest: string = "";

    drain(
      conn,
      function ondata(chunk: Uint8Array): void {
        dest += decode(chunk, "utf8");
      },
      function onclose(): void {
        assertEquals(dest, "419");
      },
      function onerror(err: Error): void {
        fail(err.message);
      }
    );

    assertEquals(dest, "");
  }
});

test({
  name: "drainage can be cancelled",
  fn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (err: Error) => void): void => {
        // a never-ending reader
        const reader: Deno.Reader = {
          async read(buf: Uint8Array): Promise<Deno.ReadResult> {
            buf.fill(99);
            return { nread: buf.length, eof: false };
          }
        };

        let count: number = 0;

        const drainage: Drainage = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onclose(): void {
            assert(count !== 0);
            resolve();
          },
          function onerror(err: Error): void {
            reject(err);
          }
        );

        // canceling the drainage.promise
        drainage.cancel();
      }
    );
  }
});

test({
  name: "cancelation with an error is actually a rejection",
  fn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (err: Error) => void): void => {
        // a never-ending reader
        const reader: Deno.Reader = {
          async read(buf: Uint8Array): Promise<Deno.ReadResult> {
            buf.fill(99);
            return { nread: buf.length, eof: false };
          }
        };

        let count: number = 0;

        const drainage: Drainage = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onclose(): void {
            reject(null);
          },
          function onerror(err: Error): void {
            assertEquals(err.message, "fraud");
            assert(count !== 0);
            resolve();
          }
        );

        // canceling the drainage.promise with an error triggers reject
        drainage.cancel(new Error("fraud"));
      }
    );
  }
});

test({
  name: "canceling twice does no harm",
  fn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (err: Error) => void): void => {
        // a never-ending reader
        const reader: Deno.Reader = {
          async read(buf: Uint8Array): Promise<Deno.ReadResult> {
            buf.fill(99);
            return { nread: buf.length, eof: false };
          }
        };

        let count: number = 0;

        const drainage: Drainage = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onclose(): void {
            assert(count !== 0);
            resolve();
          },
          function onerror(err: Error): void {
            reject(err);
          }
        );

        // double-canceling the drainage.promise
        drainage.cancel();
        drainage.cancel();
      }
    );
  }
});

test({
  name: "can limit ondata handler invocations",
  fn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (err: Error) => void): void => {
        let read: number = 0;

        // this reader pushes 10 chunks only
        const reader: Deno.Reader = {
          async read(buf: Uint8Array): Promise<Deno.ReadResult> {
            if (read++ === 10) {
              return { nread: 0, eof: true };
            }

            buf.fill(99);

            return { nread: buf.length, eof: false };
          }
        };

        let count: number = 0;

        drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onclose(): void {
            assertEquals(count, 1);
            resolve();
          },
          function onerror(err: Error): void {
            reject(err);
          },
          { limit: 1 }
        );
      }
    );
  }
});

test({
  name: "allows custom read timeouts",
  fn(): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (err: Error) => void): void => {
        // a slow reader
        const reader: Deno.Reader = {
          read(buf: Uint8Array): Promise<Deno.ReadResult> {
            return new Promise((resolve: (result: Deno.ReadResult) => void): void => {
              setTimeout((): void => {
                buf.fill(99);
                resolve({ nread: buf.length, eof: false })
              }, 500)
            })
          }
        };

        drain(
          reader,
          function ondata(chunk: Uint8Array): void {},
          function onclose(): void {
            reject(null)
          },
          function onerror(err: Error): void {
            assertEquals(err.message, "timeout")
            resolve()
          },
          { maxReadTimeout: 400 }
        );
      }
    );
  }
});

runIfMain(import.meta);
