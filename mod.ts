export async function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any
): Promise<void> {
  const it: AsyncIterableIterator<Uint8Array> = Deno.toAsyncIterator(reader);
  let result: { done: boolean; value: Uint8Array };
  for (;;) {
    result = await it.next();
    if (result.done) {
      return;
    }
    ondata(result.value);
  }
}
