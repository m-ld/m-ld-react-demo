type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

type _JsonLDDocument<PropertyTypes, ActiveContext> = {
  [K in keyof ActiveContext]?: ActiveContext[K] extends keyof PropertyTypes
    ? PropertyTypes[ActiveContext[K]]
    : unknown;
} & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
} & { [K in string]: K extends "@context" ? {} : string | number };

type NextContext<OuterContext, InnerContext> = InnerContext;

export type JsonLDDocument<PropertyTypes, OuterContext, Self> = Self extends {
  "@context": infer Context;
  [k: string]: any;
}
  ? Self & _JsonLDDocument<PropertyTypes, NextContext<OuterContext, Context>>
  : _JsonLDDocument<PropertyTypes, {}>;

// type A = { [K in string as Exclude<K, "@context">]: string | number };
type A = { [K in string]: K extends "@context" ? {} : string | number };
const a: A = { "@context": true };
