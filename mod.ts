function noop(): void {}

export function pullNonBlocking(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror?: (err: Error) => any
): Promise<void> {
  const it: AsyncIterableIterator<Uint8Array> = Deno.toAsyncIterator(reader);
  let result: { done: boolean; value: Uint8Array };

  return new Promise(
    async (): Promise<void> => {
      for (;;) {
        result = await it.next();

        if (result.done) {
          break;
        }

        ondata(result.value);
      }
    }
  ).catch(onerror || noop);
}
