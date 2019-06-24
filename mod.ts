export interface DrainOptions {
  limit?: number;
  maxReadTimeout?: number;
}

export interface Drainage {
  readonly promise: Promise<void>;
  readonly cancel: (err?: Error) => void;
}

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onclose?: () => any,
  onerror?: (err: Error) => any,
  { limit, maxReadTimeout }: DrainOptions = { limit: Infinity }
): Drainage {
  // TODO: validate options and everything else also !null

  const cancelation: { requested: boolean; error?: Error } = {
    requested: false
  };

  const drainage: Drainage = {
    promise: new Promise(
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
  readStart = Date.now()
}

          result = await it.next();

     if (maxReadTimeout !== Infinity && Date.now() - readStart > maxReadTimeout) {
       return reject(new Error(`maxReadTimeout of ${maxReadTimeout}ms exceeded.`))
     }

          // TODO: can an ait yield done and value in the same step?
          if (result.done) {
            return resolve();
          }

          ondata(result.value);
        }

        resolve();
      }
    ).then(onclose, onerror),
    cancel(err?: Error): void {
      cancelation.requested = true;
      cancelation.error = err;
    }
  };

  return drainage;
}
