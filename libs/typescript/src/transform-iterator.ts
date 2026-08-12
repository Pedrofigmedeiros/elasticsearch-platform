export async function* transformIterator<TInput, TOutput>(
  iterator: AsyncGenerator<TInput>,
  transformFn: (item: TInput) => Promise<TOutput> | TOutput,
): AsyncGenerator<TOutput> {
  for await (const item of iterator) {
    yield await transformFn(item);
  }
}

