import { InferringSelf, JsonLDDocument } from "./JsonLDDocument";

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
  <PropertyTypes, OuterContext = {}>() =>
  <const Self>(
    d: InferringSelf<Self, JsonLDDocument<PropertyTypes, OuterContext, Self>>
  ): { Actual: Self; Expected: { [K in keyof typeof d]: (typeof d)[K] } } =>
    null as any;

// A function to take documents (and thus do some type inference)
const acceptDocument = createAcceptor<PropertyTypes>();

acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
  },
  aNumber: 1,
  "http://www.example.com/aNumber": 2,
  "http://www.example.com/unknown": 2,
});

// It should accept unknown Iri properties
acceptDocument({ "http://www.example.com/unknown": 1 });
acceptDocument({ "@context": {}, "http://www.example.com/unknown": 1 });

// It should not accept unknown non-Iri properties
// @ts-expect-error
acceptDocument({ unknown: 1 });
// @ts-expect-error
acceptDocument({ "@context": {}, unknown: 1 });

// It should accept known Iri properties, and type them
acceptDocument({ "http://www.example.com/aNumber": 1 });
acceptDocument({ "@context": {}, "http://www.example.com/aNumber": 1 });
// @ts-expect-error
acceptDocument({ "http://www.example.com/aNumber": "a" });
// @ts-expect-error
acceptDocument({ "@context": {}, "http://www.example.com/aNumber": "a" });

// It should alias properties using the @context
acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    alsoANumber: "http://www.example.com/aNumber",
  },
  aNumber: 1,
  alsoANumber: 1,
});

acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    alsoANumber: "http://www.example.com/aNumber",
  },
  // @ts-expect-error
  alsoANumber: "a",
});

acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    somethingElse: "http://www.example.com/somethingElse",
  },
  // @ts-expect-error
  aNumber: "a",
  // @ts-expect-error
  alsoANumber: 1,

  somethingElse: {
    "@context": {
      alsoANumber: "http://www.example.com/aNumber",
    },
    // aNumber is still mapped
    // @ts-expect-error
    aNumber: "a",
    // and so is alsoANumber
    // @ts-expect-error
    alsoANumber: "a",
  },
});
