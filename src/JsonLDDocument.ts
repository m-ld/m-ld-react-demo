export type Scalar = string | number | boolean | null;

type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

type Thing<PropertyTypes, Context> = self extends object
  ? "an object"
  : "not an object";
// | Scalar
// | NodeObject<PropertyTypes, Context, true>;

type _NodeObject<PropertyTypes, Context> = {
  [K in keyof Context]?: Context[K] extends keyof PropertyTypes
    ? PropertyTypes[Context[K]]
    : Thing<PropertyTypes, Context>;
} /* & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
} & { [key: Iri<string, string>]: Thing<PropertyTypes, Context> } */;

type NextContext<OuterContext, LocalContext> = OuterContext & LocalContext;

export type NodeObject<PropertyTypes, OuterContext, F = false> = F extends true
  ? never
  : self extends {
      "@context": infer LocalContext;
      [k: string]: any;
    }
  ? {
      "@context": LocalContext;
    } & _NodeObject<PropertyTypes, NextContext<OuterContext, LocalContext>>
  : _NodeObject<PropertyTypes, NextContext<OuterContext, {}>>;

export type JsonLDDocument<PropertyTypes, OuterContext = {}> = NodeObject<
  PropertyTypes,
  OuterContext
>;
