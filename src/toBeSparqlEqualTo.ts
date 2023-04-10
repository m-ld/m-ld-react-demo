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

const isSparqlJs = (o: unknown): o is SparqlQuery => {
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
  sparql: string;
} & Partial<Pick<SparqlQuery, "base" | "prefixes">> => {
  if (
    !(
      typeof value === "string" ||
      isSparqlAlgebraOperation(value) ||
      isSparqlJs(value)
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

  const sparqlString = isSparqlAlgebraOperation(value)
    ? toSparql(value)
    : isSparqlJs(value)
    ? generator.stringify(value)
    : value;

  const sparqlJs = parser.parse(sparqlString);

  if (base) sparqlJs.base = base;
  if (prefixes) sparqlJs.prefixes = prefixes;

  return {
    sparql: generator.stringify(sparqlJs),
    base: sparqlJs.base,
    prefixes: sparqlJs.prefixes,
  };
};

const toBeSparqlEqualTo: MatcherFunction<[expectedSparql: unknown]> = function (
  actual,
  expected
) {
  // Take the base and prefixes from the expected value...
  const {
    sparql: expectedString,
    base,
    prefixes,
  } = normalized({
    value: expected,
    name: "Expected",
    stringify: this.utils.stringify,
  });

  // ...and use them when formatting the actual value.
  const { sparql: actualString } = normalized({
    value: actual,
    name: "Actual",
    stringify: this.utils.stringify,
    base,
    prefixes,
  });

  return matchers.toBe.call(this, actualString, expectedString);
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
