export {};

const todo = {
  "@context": {
    "@vocab": "https://todomvc.com/vocab/",
    items: {
      "@context": {
        "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
      },
      "@container": "@list",
    },
  },
  "@type": "Vtodo",
  status: "COMPLETED",
  summary: "Taste JavaScript",
  uid: "DB2CCFFD-1B37-4CA4-81B9-D724DFB70BA8",
};

// @vocab

// type Iri = string;

const withContext = {
  "@context": { "@vocab": "http://schema.org/" },
  "@id": "http://example.org/library/the-republic",
  "@type": "Book",
  // "creator": "Plato",
  name: "The Republic",
  // "contains": "http://example.org/library/the-republic#introduction"
  numberOfPages: 692,
};

type WithContext = {
  "@context": {
    "@vocab": "http://schema.org/";
    ex: "http://example.com/";
    height: "http://dimensions.example.com/height";
  };
  "@id": "http://example.org/library/the-republic";
  "@type": string;
  // "creator": "Plato",
  name: string;
  // "contains": "http://example.org/library/the-republic#introduction"
  numberOfPages: number;
  "http://schema.org/abridged": boolean;
  "ex:colorOfCover": string;
  height: string;
};

const withoutContext = {
  "@id": "http://example.org/library/the-republic",
  "@type": "http://schema.org/Book",
  "http://schema.org/name": "The Republic",
  "http://schema.org/numberOfPages": 692,
};

type WithoutContext = {
  "@id": string;
  "@type": string;
  "http://schema.org/name": string;
  "http://schema.org/numberOfPages": number;
};

// TODO: Wildly incomplete.
type JSONObject = Record<string, unknown>;
type Context = JSONObject;
type ContextedObject = JSONObject & { "@context": Context };
type VocabedContext = { "@vocab": string };

type Iri = `${string}:${string}`;

type VocabExpand<C extends Context, P extends string> = C extends VocabedContext
  ? P extends Iri
    ? unknown
    : `${C["@vocab"]}${P}`
  : unknown;

type PrefixExpand<
  C extends Context,
  P extends string
> = P extends `${infer Prefix}:${infer Suffix}`
  ? Prefix extends keyof C
    ? C[Prefix] extends string
      ? `${C[Prefix]}${Suffix}`
      : unknown
    : unknown
  : unknown;

type TermExpand<C extends Context, P extends string> = P extends keyof C
  ? C[P] extends string
    ? C[P]
    : unknown
  : unknown;

type Expand<WC extends ContextedObject> = {
  [P in Extract<keyof WC, string> as P extends Keyword
    ? P
    : TermExpand<WC["@context"], P> extends Extract<infer Expanded, string>
    ? Extract<Expanded, string>
    : PrefixExpand<WC["@context"], P> extends Extract<infer Expanded, string>
    ? Extract<Expanded, string>
    : VocabExpand<WC["@context"], P> extends Extract<infer Expanded, string>
    ? Extract<Expanded, string>
    : P extends Iri
    ? P
    : never]: WC[P];
};

type Keyword = `@${string}`;

export type Output = Expand<WithContext>;

// const a: Expand<WithContext> = {
//   "@id": "http://example.org/library/the-republic",
//   "@type": "http://schema.org/Book",
//   "http://schema.org/name": "The Republic",
//   "http://schema.org/numberOfPages": 692,
// };

interface Foo {
  /** This is some documentation! */
  a: number;
}

type Bar = { [P in keyof Foo]: Foo[P] };

// const b: Bar["a"];
