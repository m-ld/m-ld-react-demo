import { Query, QueryResult, Scalar, Variable } from "./QueryResult";
import { Equal } from "./testUtils/Equal";

interface PropertyTypes {
  aNumber: number;
  multipleNumbers: number;
  aString: string;
  multipleStrings: string;
  aNumberVariable: number;
  aStringVariable: string;
  anArrayOfString: string;
}

type AQuery = Query<PropertyTypes>;

// A non-array query specifically, which is easier to ask questions about if we
// separate it first.
type AQueryObjectNode = Exclude<AQuery, unknown[]>;

// Super short way to write "single element or array of"
type A<T> = T | ReadonlyArray<T>;

true satisfies Equal<AQueryObjectNode["anUnknown"], A<Scalar | AQuery>>;
true satisfies Equal<AQueryObjectNode["multipleUnknowns"], A<Scalar | AQuery>>;
true satisfies Equal<
  AQueryObjectNode["aNumber"],
  A<number | Variable> | undefined
>;
true satisfies Equal<AQueryObjectNode["aString"], A<string> | undefined>;
true satisfies Equal<
  AQueryObjectNode["aNumberVariable"],
  A<number | Variable> | undefined
>;
true satisfies Equal<
  AQueryObjectNode["aStringVariable"],
  A<string> | undefined
>;
true satisfies Equal<AQueryObjectNode["anUnknownVariable"], A<Scalar | AQuery>>;
true satisfies Equal<
  AQueryObjectNode["anArrayOfString"],
  A<string> | undefined
>;
true satisfies Equal<AQueryObjectNode["anArrayOfUnknown"], A<Scalar | AQuery>>;

declare function doQuery<Q extends AQuery>(
  query: Q
): QueryResult<Q, PropertyTypes>;

const result = doQuery({
  anUnknown: 5,
  multipleUnknowns: [1, "a"],
  aNumber: 1,
  multipleNumbers: [1, 2],
  aString: "a",
  multipleStrings: ["a", "b"],
  aNumberVariable: "?",
  aStringVariable: "?",
  anUnknownVariable: "?",
  anArrayOfString: ["?"],
  anArrayOfUnknown: ["?"],

  aChild: {
    aNumber: 1,
    aNumberVariable: "?",
    anArrayOfString: ["?"],
  },

  anArrayOfChildren: [
    {
      aNumber: 1,
      aNumberVariable: "?",
      anArrayOfString: ["?"],
    },
  ],

  aUnionOfChildren: [
    {
      aNumber: 1,
      aString: "a",
    },
    {
      aNumber: 2,
      aString: "b",
    },
  ],

  aSetOfChildren: {
    "@set": [
      {
        aNumber: 1,
        aNumberVariable: "?",
        anArrayOfString: ["?"],
      },
    ],
    "@count": "?",
  },
} as const);

type Result = typeof result;

true satisfies Equal<Result["anUnknown"], 5>;
true satisfies Equal<Result["multipleUnknowns"], Array<1 | "a">>;
true satisfies Equal<Result["aNumber"], 1>;
true satisfies Equal<Result["multipleNumbers"], Array<1 | 2>>;
true satisfies Equal<Result["aString"], "a">;
true satisfies Equal<Result["multipleStrings"], Array<"a" | "b">>;
true satisfies Equal<Result["aNumberVariable"], number>;
true satisfies Equal<Result["aStringVariable"], string>;
true satisfies Equal<Result["anUnknownVariable"], Scalar>;
true satisfies Equal<Result["anArrayOfString"], string[]>;
true satisfies Equal<Result["anArrayOfUnknown"], Scalar[]>;

type Child = Pick<Result, "aNumber" | "aNumberVariable" | "anArrayOfString">;

true satisfies Equal<Result["aChild"], Child>;
true satisfies Equal<Result["anArrayOfChildren"], Child[]>;

true satisfies Equal<
  Result["aUnionOfChildren"],
  Array<
    | {
        aNumber: 1;
        aString: "a";
      }
    | {
        aNumber: 2;
        aString: "b";
      }
  >
>;

true satisfies Equal<
  Result["aSetOfChildren"],
  {
    "@set": Child[];
    "@count": number;
  }
>;
