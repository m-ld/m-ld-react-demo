import { type Equal } from "type-plus";
import { QueryResult, Scalar } from "./QueryResult";

const query = {
  aNumber: 1,
  aString: "a",
  aVariable: "?",
  aCollectionOfScalars: ["?"],

  aChild: {
    aNumber: 1,
    aString: "a",
    aVariable: "?",
    aCollectionOfScalars: ["?"],
  },

  aCollectionOfChildren: [
    {
      aNumber: 1,
      aString: "a",
      aVariable: "?",
      aCollectionOfScalars: ["?"],
    },
  ],

  aUnionCollectionOfChildren: [
    {
      aNumber: 1,
      aString: "a",
      aVariable: "?",
    },
    {
      aNumber: 2,
      aString: "b",
      aVariable: "?",
    },
  ],

  aSetOfChildren: {
    "@set": [
      {
        aNumber: 1,
        aString: "a",
        aVariable: "?",
        aCollectionOfScalars: ["?"],
      },
    ],
    "@count": "?",
  },
} as const;

type Result = QueryResult<typeof query>;

true satisfies Equal<Result["aNumber"], 1>;
true satisfies Equal<Result["aString"], "a">;
true satisfies Equal<Result["aVariable"], Scalar>;
true satisfies Equal<Result["aCollectionOfScalars"], Scalar[]>;

type Child = Pick<
  Result,
  "aNumber" | "aString" | "aVariable" | "aCollectionOfScalars"
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
        aVariable: Scalar;
      }
    | {
        aNumber: 2;
        aString: "b";
        aVariable: Scalar;
      }
  >
>;
