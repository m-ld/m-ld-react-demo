import { JsonLDDocument } from "./JsonLDDocument";
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
  <Self>(d: JsonLDDocument<PropertyTypes, Self>) => {};

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
acceptDocument({ "http://www.example.com/unknown": 1 });
acceptDocument({ "@context": {}, "http://www.example.com/unknown": 1 });

// It should not accept unknown non-Iri properties
// @ts-expect-error
acceptDocument({ unknown: 1 });
// @ts-expect-erro/r
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
  } as const,
  aNumber: 1,
  alsoANumber: 1,
});

acceptDocument({
  "@context": {
    aNumber: "http://www.example.com/aNumber",
    alsoANumber: "http://www.example.com/aNumber",
  } as const,
  // @ts-expect-error
  alsoANumber: "a",
});
