type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

export type NextContext<OuterContext, InnerContext> = OuterContext &
  InnerContext;

type _NodeObject<PropertyTypes, ActiveContext, Self> = {
  [K in keyof ActiveContext]?: ActiveContext[K] extends keyof PropertyTypes
    ? PropertyTypes[ActiveContext[K]]
    : K extends keyof Self
    ? NodeObject<PropertyTypes, ActiveContext, Self[K]>
    : never;
} & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
};

export type NodeObject<PropertyTypes, OuterContext, Self> = Self &
  _NodeObject<
    PropertyTypes,
    NextContext<
      OuterContext,
      Self extends {
        "@context": infer LocalContext;
      }
        ? LocalContext
        : {}
    >,
    Self
  >;

export type JsonLDDocument<PropertyTypes, OuterContext, Self> = NodeObject<
  PropertyTypes,
  OuterContext,
  Self
>;
