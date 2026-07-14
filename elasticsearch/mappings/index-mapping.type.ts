import { estypes } from '@elastic/elasticsearch';

export type IndexMapping = {
  mappings: {
    dynamic: "false";
    properties: Record<string, estypes.MappingProperty>;
  }
}
