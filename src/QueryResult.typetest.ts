import { type Equal } from "type-plus";
import { QueryResult, Scalar } from "./QueryResult";

const query = {
  aNumber: 1,
  aString: "a",
  aNumberVariable: "?",
  aStringVariable: "?",
  anUnknownVariable: "?",
  aCollectionOfScalars: ["?"],

  aChild: {
    aNumber: 1,
    aString: "a",
    aNumberVariable: "?",
    aStringVariable: "?",
    anUnknownVariable: "?",
    aCollectionOfScalars: ["?"],
  },

  aCollectionOfChildren: [
    {
      aNumber: 1,
      aString: "a",
      aNumberVariable: "?",
      aStringVariable: "?",
      anUnknownVariable: "?",
      aCollectionOfScalars: ["?"],
    },
  ],

  aUnionCollectionOfChildren: [
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
        aString: "a",
        aNumberVariable: "?",
        aStringVariable: "?",
        anUnknownVariable: "?",
        aCollectionOfScalars: ["?"],
      },
    ],
    "@count": "?",
  },
} as const;

interface PropertyTypes {
  aNumberVariable: number;
  aStringVariable: string;
}

type Result = QueryResult<typeof query, PropertyTypes>;

true satisfies Equal<Result["aNumber"], 1>;
true satisfies Equal<Result["aString"], "a">;
true satisfies Equal<Result["aNumberVariable"], number>;
true satisfies Equal<Result["aStringVariable"], string>;
true satisfies Equal<Result["anUnknownVariable"], Scalar>;
true satisfies Equal<Result["aCollectionOfScalars"], Scalar[]>;

type Child = Pick<
  Result,
  | "aNumber"
  | "aString"
  | "aNumberVariable"
  | "aStringVariable"
  | "anUnknownVariable"
  | "aCollectionOfScalars"
>;

true satisfies Equal<Result["aChild"], Child>;
true satisfies Equal<Result["aCollectionOfChildren"], Child[]>;

true satisfies Equal<
  Result["aSetOfChildren"],
  {
    "@set": Child[];
    "@count": number;
  }
>;

true satisfies Equal<
  Result["aUnionCollectionOfChildren"],
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
