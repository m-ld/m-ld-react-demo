import { expect } from "@jest/globals";
import { Algebra, toSparql, translate } from "sparqlalgebrajs";
import { Parser, Generator, SparqlQuery } from "sparqljs";
import type { MatcherFunction, MatcherUtils } from "expect";
import matchers from "expect/build/matchers";

// PRed as: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/65054
declare module "sparqljs" {
  interface Update {
    base?: string | undefined;
  }
}

declare module "sparqlalgebrajs" {
  export function toSparqlJs(op: Algebra.Operation): SparqlQuery;
}

const isSparqlAlgebraOperation = (o: unknown): o is Algebra.Operation =>
  !!o &&
  typeof o === "object" &&
  "type" in o &&
  Object.values<unknown>(Algebra.types).indexOf(o.type) != -1;

const isSparqlJsSparqlQuery = (o: unknown): o is SparqlQuery => {
  return (
    !!o &&
    typeof o === "object" &&
    "type" in o &&
    (o.type === "query" || o.type === "update")
  );
};

/**
 * Normalize the given SPARQL (whether string, Algebra, or SparqlJS) as
 * SparqlJS's stringification, with the given base and prefixes if given.
 */
const normalized = ({
  value,
  name,
  base,
  prefixes,
  stringify,
}: {
  value: unknown;
  name: string;
  stringify: MatcherUtils["utils"]["stringify"];
} & Partial<Pick<SparqlQuery, "base" | "prefixes">>): {
  sparqlJs: SparqlQuery;
  string: string;
} & Partial<Pick<SparqlQuery, "base" | "prefixes">> => {
  if (
    !(
      typeof value === "string" ||
      isSparqlAlgebraOperation(value) ||
      isSparqlJsSparqlQuery(value)
    )
  ) {
    throw new Error(
      `${name} value should be SPARQL algebra, SparqlJS, or string, but was: ${stringify(
        value
      )}`
    );
  }

  var generator = new Generator();
  var parser = new Parser();

  // Always coerce to a string first, then parse with SparqlJS, then generate a
  // string again with SparqlJS. The SparqlJS parser manipulates blank nodes in
  // such a way that the only way to make matching possible is to always run
  // through it.

  const incomingSparqlString = isSparqlAlgebraOperation(value)
    ? toSparql(value)
    : isSparqlJsSparqlQuery(value)
    ? generator.stringify(value)
    : value;

  const sparqlJs = parser.parse(incomingSparqlString);

  if (base) sparqlJs.base = base;
  if (prefixes) sparqlJs.prefixes = prefixes;

  return {
    sparqlJs,
    string: generator.stringify(sparqlJs),
    base: sparqlJs.base,
    prefixes: sparqlJs.prefixes,
  };
};

// TODO: Make an equality checker that's order-independent where appropriate.
// function areSparqlEqual(a: unknown, b: unknown): boolean | undefined {
//   const isAQuery = isSparqlJsSparqlQuery(a);
//   const isBQuery = isSparqlJsSparqlQuery(b);

//   if (isAQuery && isBQuery) {
//     return a.equals(b);
//   } else if (isAQuery !== isBQuery) {
//     return false;
//   } else {
//     return undefined;
//   }
// }

// expect.addEqualityTesters([areVolumesEqual]);

const toBeSparqlEqualTo: MatcherFunction<[expectedSparql: unknown]> = function (
  actual,
  expected
) {
  // Take the base and prefixes from the expected value...
  const {
    sparqlJs: expectedSparqlJs,
    string: expectedString,
    base,
    prefixes,
  } = normalized({
    value: expected,
    name: "Expected",
    stringify: this.utils.stringify,
  });

  // ...and use them when formatting the actual value.
  const { sparqlJs: actualSparqlJs, string: actualString } = normalized({
    value: actual,
    name: "Actual",
    stringify: this.utils.stringify,
    base,
    prefixes,
  });

  this.equals(expectedSparqlJs, actualSparqlJs);
  return {
    ...matchers.toBe.call(this, actualString, expectedString),
    pass: this.equals(expectedSparqlJs, actualSparqlJs),
  };
};

expect.extend({ toBeSparqlEqualTo });

declare module "expect" {
  interface AsymmetricMatchers {
    toBeSparqlEqualTo(
      expectedSparql: string | Algebra.Operation
    ): AsymmetricMatcher<string>;
  }

  interface Matchers<R> {
    toBeSparqlEqualTo(expectedSparql: string | Algebra.Operation): R;
  }
}
