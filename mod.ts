export interface DrainOptions {
  limit?: number;
  maxReadTimeout?: number;
}

export type Cancel = (err?: Error) => void;

// export interface Drainage {
//   readonly promise: Promise<void>;
//   readonly cancel: (err?: Error) => void;
// }

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onclose: () => any = (): void => undefined,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  { limit, maxReadTimeout }: DrainOptions = {
    limit: Infinity,
    maxReadTimeout: Infinity
  }
): Cancel {
  limit = limit || Infinity;
  maxReadTimeout = maxReadTimeout || Infinity;

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

        if (maxReadTimeout !== Infinity) {
          readStart = Date.now();
        }

        result = await it.next();

        if (
          maxReadTimeout !== Infinity &&
          Date.now() - readStart > maxReadTimeout
        ) {
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

  // const drainage: Drainage = {
  //   promise: ,
  //
  // };

  // return drainage;
  //
  return function cancel(err?: Error): void {
    cancelation.error = err;
    cancelation.requested = true;
  };
}
