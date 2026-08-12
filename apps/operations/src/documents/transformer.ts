import { Injectable } from "@nestjs/common";

import { Row } from "./reader";
import { Document } from "./writer";

type Transform = (raw: Row) => Partial<Document>;

@Injectable()
export class Transformer {
  private readonly transformations: Transform[] = [transformDate, transformBool];

  async transform(raw: Row): Promise<Document> {
    const doc = { ...raw } as unknown as Document;

    for (const fn of this.transformations) {
      Object.assign(doc, fn(raw));
    }

    return doc;
  }
}

export const transformDate = (raw: Row): Partial<Document> => {
  const result: Record<string, unknown> = {};
  const dateFields: (keyof Row)[] = ['last_processed_time', 'first_seen'];

  for (const field of dateFields) {
    const value = raw[field];
    if (typeof value === 'string') {
      result[field] = value
        .replace(' ', 'T')
        .replace('+00', 'Z')
        .replace(/\.\d+/, ''); // remove fractional seconds (variable length in source data)
    }
  }

  return result as Partial<Document>;
};

export const transformBool = (raw: Row): Partial<Document> => {
  const result: Record<string, unknown> = {};
  const boolFields: (keyof Row)[] = ['got_summary', 'got_ner', 'is_being_worked'];

  for (const field of boolFields) {
    const value = raw[field];
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 't') result[field] = true;
      if (lower === 'f') result[field] = false;
    }
  }

  return result as Partial<Document>;
};
