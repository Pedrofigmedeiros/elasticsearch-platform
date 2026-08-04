import { Injectable } from "@nestjs/common";
import { Config } from "libs/config"

@Injectable()
export class Transformer {
  private readonly transformationsSync;
  private readonly transformationsAsync;

  constructor(
    private readonly config: Config
  ) {
    this.transformationsSync = [
      transformDate,
      transformBool,
    ];
    this.transformationsAsync = [
      // Add future async transformations here
    ];
  }

  async transform(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
    const doc: Record<string, unknown> = {
      ...raw,
    }

    for (const fn of this.transformationsSync) {
      Object.assign(doc, fn(raw));
    }
    const asyncResults = await Promise.all(
      this.transformationsAsync.map(async (fn) => fn(raw)),
    );
    for (const result of asyncResults) {
      Object.assign(doc, result);
    }

    return doc;
  }
}

export const transformDate = (raw: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const dateFields = ['last_processed_time', 'first_seen'];

  dateFields.forEach(field => {
    const value = raw[field];
    if (value && typeof value === 'string') {
      const transformed = value
        .replace(' ', 'T')
        .replace('+00', 'Z')
        .replace(/\.\d{6}/, '');

      result[field] = transformed;
    }
  });

  return result
}

export const transformBool = (raw: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const boolFields = ['got_summary', 'got_ner', 'is_being_worked'];

  boolFields.forEach(field => {
    const value = raw[field];
    if (value && typeof value === 'string') {
      const lower = value.toLowerCase();

      if (lower === 't') {
        result[field] = true;
      } else if (lower === 'f') {
        result[field] = false;
      }
    }
  });

  return result
}