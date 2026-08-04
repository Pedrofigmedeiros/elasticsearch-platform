import { Injectable } from "@nestjs/common";
import { Config } from "libs/config"

@Injectable()
export class Transformer {
  private readonly transformationsSync;

  constructor(
    config: Config,
  ) {
  }
}

export const transformDate = (raw: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const dateFields = ['last_processed_time', 'first_seen'];

  dateFields.forEach(field => {
    const value = raw[field];
    if (value && typeof value === 'string') {
      const transformed = value
        .replace('', 'T')
        .replace('+00', 'Z')
        .replace(/\.\d{6}/, '');

      result[field] = transformed;
    }
  });

  return result
}