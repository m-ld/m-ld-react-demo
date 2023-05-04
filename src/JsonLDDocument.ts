type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

type _JsonLDDocument<PropertyTypes, Context> = {
  [K in keyof Context]?: Context[K] extends keyof PropertyTypes
    ? PropertyTypes[Context[K]]
    : unknown;
} & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
} & { [key: Iri<string, string>]: unknown };

export type JsonLDDocument<PropertyTypes, Context> = {
  "@context": Context;
} & _JsonLDDocument<PropertyTypes, Context>;
