import { Injectable } from '@nestjs/common';
import { transformIterator } from '@app/typescript';

import { Reader, Row } from './reader';
import { Transformer } from './transformer';
import { Document, Writer, WriteStats } from './writer';

@Injectable()
export class Processor {
  constructor(
    private readonly reader: Reader,
    private readonly transformer: Transformer,
    private readonly writer: Writer,
  ) {}

  async process({
    csvPath,
    indexName,
    bulkSize = 1000,
  }: {
    csvPath: string;
    indexName: string;
    bulkSize?: number;
  }): Promise<WriteStats> {
    const rows = this.reader.read(csvPath);
    const docs = transformIterator<Row, Document>(rows, (row) =>
      this.transformer.transform(row),
    );

    return this.writer.write(indexName, docs, { bulkSize });
  }
}

