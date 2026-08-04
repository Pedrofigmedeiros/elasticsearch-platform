export async function* bufferAsyncIterator<T>(
  input: AsyncIterable<T>,
  size = 1,
): AsyncGenerator<T[]> {
  let buffer: T[] = [];
  for await (const item of input) {
    buffer.push(item);
    if (buffer.length >= size) {
      yield buffer;
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    yield buffer;
  }
}
