export interface DrainOptions {
  // max number of reads
  limit?: number;
  // max read timeout
  timeout?: number;
}

export type Cancel = (err?: Error) => void;

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  onclose: () => any = (): void => undefined,
  { limit = Infinity, timeout = Infinity }: DrainOptions = {}
): Cancel {
  const time: boolean = timeout !== Infinity;

  let cancelReq: boolean = false;
  let cancelErr: Error = null;

  new Promise(
    async (
      resolve: () => void,
      reject: (err: Error) => void
    ): Promise<void> => {
      const it: AsyncIterableIterator<Uint8Array> = Deno.toAsyncIterator(
        reader
      );

      let result: { done: boolean; value: Uint8Array };
      let readStart: number = NaN;

      for (let i: number = 0; i < limit; ++i) {
        if (cancelReq) {
          return cancelErr ? reject(cancelErr) : resolve();
        }

        // TODO: use the performance api for these measurements
        if (time) {
          readStart = Date.now();
        }

        result = await it.next();

        if (time && Date.now() - readStart > timeout) {
          return reject(
            new Error(`Max read timeout of ${timeout}ms exceeded.`)
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
    cancelErr = err;
    cancelReq = true;
  };
}
