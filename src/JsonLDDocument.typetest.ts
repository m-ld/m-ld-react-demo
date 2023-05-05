import { JsonLDDocument, NodeObject } from "./JsonLDDocument";
import { Equal } from "./testUtils/Equal";

interface PropertyTypes {
  "http://www.example.com/aNumber": number;
  "http://www.example.com/multipleNumbers": number;
  "http://www.example.com/aString": string;
  "http://www.example.com/multipleStrings": string;
  "http://www.example.com/aNumberVariable": number;
  "http://www.example.com/aStringVariable": string;
  "http://www.example.com/anArrayOfString": string;
}

const createAcceptor =
  <PropertyTypes>() =>
  (d: JsonLDDocument<PropertyTypes>) => {};

// A function to take documents (and thus do some type inference)
const acceptDocument = createAcceptor<PropertyTypes>();

acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
  } as const,
  aNumber: 1,
  "http://www.example.com/aNumber": 2,
  "http://www.example.com/unknown": 2,
});

// It should accept unknown Iri properties
acceptDocument({ "@context": {}, "http://www.example.com/unknown": 1 });
acceptDocument({ "http://www.example.com/unknown": 1 });

// It should not accept unknown non-Iri properties
// @ts-expect-error
acceptDocument({ "@context": {}, unknown: 1 });
// @ts-expect-error
acceptDocument({ unknown: 1 });

// It should accept known Iri properties, and type them
acceptDocument({ "@context": {}, "http://www.example.com/aNumber": 1 });
acceptDocument({ "http://www.example.com/aNumber": 1 });
// @ts-expect-error
acceptDocument({ "@context": {}, "http://www.example.com/aNumber": "a" });
// @ts-expect-error
acceptDocument({ "http://www.example.com/aNumber": "a" });

// It should alias properties using the @context
acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    alsoANumber: "http://www.example.com/aNumber",
  } as const,
  aNumber: 1,
  alsoANumber: 1,
});

// @ts-expect-error
acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    alsoANumber: "http://www.example.com/aNumber",
  } as const,
  alsoANumber: "a",
});

// It should cascade the context.
acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    somethingElse: "http://www.example.com/somethingElse",
  } as const,
  aNumber: 1,
  somethingElse: {
    // "@context": {
    //   aString: "http://www.example.com/aString",
    // } as const,
    // aNumber: 1,
    // aString: "a",
    // @ts-expect-erro/r
    // unknown: 2,
  },
});

// Type '{}' is not assignable to type '
// type A = NodeObject<
//   PropertyTypes,
//   {
//     readonly aNumber: "http://www.example.com/aNumber";
//     readonly somethingElse: "http://www.example.com/somethingElse";
//   }
// >;
// const a: A = {};
