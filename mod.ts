export interface DrainOptions {
  limit?: number;
  maxReadTimeout?: number;
}

export type Cancel = (err?: Error) => void;

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  onclose: () => any = (): void => undefined,
  { limit = Infinity, maxReadTimeout = Infinity }: DrainOptions = {}
): Cancel {
  const time: boolean = maxReadTimeout !== Infinity;
  const cancelation: { requested?: boolean; error?: Error } = {};

  new Promise(
    async (
      resolve: () => void,
      reject: (err: Error) => void
    ): Promise<void> => {
      const it: AsyncIterableIterator<Uint8Array> = Deno.toAsyncIterator(
        reader
      );

      let readStart: number = NaN;

      let result: { done: boolean; value: Uint8Array };

      for (let i: number = 0; i < limit; ++i) {
        if (cancelation.requested) {
          return cancelation.error ? reject(cancelation.error) : resolve();
        }

        // TODO: use the performance api for these measurements
        if (time) {
          readStart = Date.now();
        }

        result = await it.next();

        if (time && Date.now() - readStart > maxReadTimeout) {
          return reject(
            new Error(`maxReadTimeout of ${maxReadTimeout}ms exceeded.`)
          );
        }

        // TODO: can an ait yield done and value in the same step?
        if (result.done) {
          return resolve();
        }

        ondata(result.value);
      }

      resolve();
    }
  ).then(onclose, onerror);

  return function cancel(err?: Error): void {
    cancelation.error = err;
    cancelation.requested = true;
  };
}
