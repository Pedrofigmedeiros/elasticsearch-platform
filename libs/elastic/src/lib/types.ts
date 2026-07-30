import { estypes } from '@elastic/elasticsearch';

export interface IndexMapping {
  mappings: estypes.MappingTypeMapping;
  settings: estypes.IndicesIndexSettings;
}

export interface IndexDefinition {
  alias: string;
  build: () => IndexMapping;
}
