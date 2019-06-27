export interface DrainOptions {
  // max number of reads
  limit?: number;
}

export type Cancel = (err?: Error) => void;

export function drain(
  reader: Deno.Reader,
  ondata: (chunk: Uint8Array) => any,
  onerror: (err: Error) => any = (err: Error): void => {
    throw err;
  },
  onclose: () => any = (): void => undefined,
  { limit = Infinity }: DrainOptions = {}
): Cancel {

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

      for (let i: number = 0; i < limit; ++i) {
        if (cancelReq) {
          return cancelErr ? reject(cancelErr) : resolve();
        }

        result = await it.next();

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
