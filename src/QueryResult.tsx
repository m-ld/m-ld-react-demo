import { HintedUnion, Preserved } from "./typeUtils";

// Arrays are assignable to ReadonlyArray, but not vice versa. By using
// ReadonlyArray, we're promising not to mutate the array while we have it. `as
// const` makes arrays readonly, so this comes up quite a bit.
type OneOrSeveral<T> = T | ReadonlyArray<T>;

export type Scalar = string | number;

/** A string representing a variable. That is, a string beginning with `?`. */
export type Variable<Name extends string = string> = Preserved<
  string extends Name ? HintedUnion<"?", `?${string}`> : `?${Name}`
>;

interface OperatorToScalar {
  "@count": number;
}

type ScalarFor<Key, PropertyTypes> = Key extends keyof OperatorToScalar
  ? OperatorToScalar[Key]
  : Key extends keyof PropertyTypes
  ? PropertyTypes[Key]
  : Scalar;

// prettier-ignore
export type QueryResult<QueryNode, PropertyTypes  = {}, Key extends string | void = void> =
  // For an array, each element is itself a query, and the result is an array of
  // query results matching any of those queries. (ReadonlyArray also covers
  // non-readonly Arrays)
  QueryNode extends ReadonlyArray<infer T> ? Array<QueryResult<T, PropertyTypes, Key>> : 

  // For an object (that's not an array), each value is itself a query, and
  // the result is an object with an entry for each of the same keys, where
  // the value is the result of its query.
  QueryNode extends object ? {
    [Key in Extract<keyof QueryNode, string>]:
      QueryResult<QueryNode[Key], PropertyTypes, Key>;
  } :

  // For a variable, the result is a scalar of the type expected at this node.
  QueryNode extends Variable ? ScalarFor<Key, PropertyTypes> :

  // For a scalar (that's not a variable), the result is exactly that scalar.
  QueryNode extends ScalarFor<Key, PropertyTypes> ? QueryNode :
  
  // Finally, if it somehow matches none of these branches, we've made a mistake
  // and are missing a case.
  never;

export type Query<PropertyTypes> =
  | QueryObjectNode<PropertyTypes>
  | QueryObjectNode<PropertyTypes>[];

type QueryObjectNode<PropertyTypes> = {
  [P in string]: OneOrSeveral<Scalar | Variable | Query<PropertyTypes>>;
} & {
  [Key in keyof PropertyTypes]?: OneOrSeveral<PropertyTypes[Key] | Variable>;
};
