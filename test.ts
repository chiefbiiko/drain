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
import { Cancel, drain } from "./mod.ts";

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
      function onerror(err: Error): void {
        fail(err.message);
      },
      function onclose(): void {
        assertEquals(dest, "419");
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

        const cancel: Cancel = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onerror(err: Error): void {
            reject(err);
          },
          function onclose(): void {
            assert(count !== 0);
            resolve();
          }
        );

        // canceling the drainage
        cancel();
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

        const cancel: Cancel = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onerror(err: Error): void {
            assertEquals(err.message, "fraud");
            assert(count !== 0);
            resolve();
          },
          function onclose(): void {
            reject(new Error("unreachable"));
          }
        );

        // canceling the drainage with an error triggers onerror
        cancel(new Error("fraud"));
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

        const cancel: Cancel = drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onerror(err: Error): void {
            reject(err);
          },
          function onclose(): void {
            assert(count !== 0);
            resolve();
          }
        );

        // double-canceling the internal promise
        cancel();
        cancel();
      }
    );
  }
});

test({
  name: "can limit ondata handler invocations",
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

        drain(
          reader,
          function ondata(chunk: Uint8Array): void {
            ++count;
          },
          function onerror(err: Error): void {
            reject(err);
          },
          function onclose(): void {
            assertEquals(count, 1);
            resolve();
          },
          { limit: 1 }
        );
      }
    );
  }
});

runIfMain(import.meta);
