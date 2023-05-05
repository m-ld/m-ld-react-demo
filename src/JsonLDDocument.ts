type Iri<Prefix extends string, Suffix extends string> = `${Prefix}:${Suffix}`;

type _NodeObject<PropertyTypes, ActiveContext, Self> = {
  [K in keyof ActiveContext]?: ActiveContext[K] extends keyof PropertyTypes
    ? PropertyTypes[ActiveContext[K]]
    : K extends keyof Self
    ? NodeObject<PropertyTypes, ActiveContext, Self[K]>
    : never;
} & {
  [K in keyof PropertyTypes]?: PropertyTypes[K];
};

type NextContext<OuterContext, InnerContext> = OuterContext & InnerContext;

type NodeObject<PropertyTypes, OuterContext, Self> = Self extends {
  "@context": infer LocalContext;
}
  ? Self &
      _NodeObject<PropertyTypes, NextContext<OuterContext, LocalContext>, Self>
  : Self & _NodeObject<PropertyTypes, NextContext<OuterContext, {}>, Self>;

export type JsonLDDocument<PropertyTypes, OuterContext, Self> = NodeObject<
  PropertyTypes,
  OuterContext,
  Self
>;
