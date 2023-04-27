export type Scalar = string | number;

type Variable<Name extends string = ""> = `?${Name}`;

interface OperatorToScalar {
  "@count": number;
}

type ScalarFor<Key, PropertyTypes> = Key extends keyof OperatorToScalar
  ? OperatorToScalar[Key]
  : Key extends keyof PropertyTypes
  ? PropertyTypes[Key]
  : Scalar;

// prettier-ignore
export type QueryResult<Query, PropertyTypes  = {}, Key extends string | void = void> =
  // For an array, each element is itself a query, and the result is an array of
  // query results matching any of those queries. (ReadonlyArray also covers
  // non-readonly Arrays)
  Query extends ReadonlyArray<infer T> ? Array<QueryResult<T, PropertyTypes>> : 

  // For an object (that's not an array), each value is itself a query, and
  // the result is an object with an entry for each of the same keys, where
  // the value is the result of its query.
  Query extends object ? {
    [Key in Extract<keyof Query, string>]:
      QueryResult<Query[Key], PropertyTypes, Key>;
  } :

  // For a variable, the result is a scalar of the type expected at this node.
  Query extends Variable<string> ? ScalarFor<Key, PropertyTypes> :

  // For a scalar (that's not a variable), the result is exactly that scalar.
  Query extends ScalarFor<Key, PropertyTypes> ? Query :
  
  // Finally, if it somehow matches none of these branches, we've made a mistake
  // and are missing a case.
  never;
