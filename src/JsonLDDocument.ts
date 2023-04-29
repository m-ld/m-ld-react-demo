type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

export type JsonLDDocument<PropertyTypes, Context> = {
  "@context": Context;
} & {
  [K in keyof Context]?: Context[K] extends keyof PropertyTypes
    ? PropertyTypes[Context[K]]
    : unknown;
} & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
} & { [key: Iri<string, string>]: unknown };
