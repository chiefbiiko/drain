export interface Drainage {
  promise: Promise<void>;
  cancel: (err?: Error) => void;
}

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any
): Drainage {
  const drainage: Drainage = {} as Drainage;

  drainage.promise = new Promise(
    async (
      resolve: () => void,
      reject: (err: Error) => void
    ): Promise<void> => {
      drainage.cancel = (err?: Error): void => (err ? reject(err) : resolve());

      const it: AsyncIterableIterator<Uint8Array> = Deno.toAsyncIterator(
        reader
      );

      let result: { done: boolean; value: Uint8Array };

      for (;;) {
        result = await it.next();

        if (result.done) {
          break;
        }

        ondata(result.value);
      }

      resolve();
    }
  );

  return drainage;
}
