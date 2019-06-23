import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";
import { assertEquals, fail } from "https://deno.land/std/testing/asserts.ts";
import {
  encode,
  decode
} from "https://denopkg.com/chiefbiiko/std-encoding/mod.ts";
import { drain } from "./mod.ts";

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

    function ondata(chunk: Uint8Array): void {
      dest += decode(chunk, "utf8");
    }

    // After calling drain on a Deno.Reader the ondata handler will
    // be called with every chunk read from the reader
    drain(conn, ondata)
      // drain reutrns a Drainage which has two props: promise and cancel()
      .promise // onclose
      .then((): void => assertEquals(dest, "419"))
      // onerror
      .catch(fail);

    assertEquals(dest, "");
  }
});

runIfMain(import.meta);
