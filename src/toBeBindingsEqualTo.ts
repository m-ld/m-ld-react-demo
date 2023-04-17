import { expect } from "@jest/globals";
import { Bindings } from "@rdfjs/types";
import type { MatcherFunction } from "expect";
import matchers from "expect/build/matchers";
import { DataFactory } from "rdf-data-factory";
import { BindingsFactory } from "@comunica/bindings-factory";
import { stringToTerm, termToString } from "rdf-string";
import { identity, mapValues, sortBy, zip } from "lodash";
import { ColumnUserConfig, table } from "table";

// Note: You'll see the unfortunate word "bindingses" in this module. That
// refers to an instance of `Bindings[]`.

/**
 * Make all properties in T *not* readonly
 */
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type ExpectedBindings = string[][];

const isBindings = (o: unknown): o is Bindings =>
  !!o && typeof o === "object" && "type" in o && o.type === "bindings";

const isIterable = (o: unknown): o is Iterable<unknown> =>
  !!o &&
  typeof o === "object" &&
  Symbol.iterator in o &&
  typeof o[Symbol.iterator] === "function";

// NOTE: Actually iterates over the iterable.
const isIterableOf = <E>(
  o: unknown,
  predicate: (e: unknown) => e is E
): o is Iterable<E> => {
  if (!isIterable(o)) return false;
  for (const element of o) {
    if (!predicate(element)) return false;
  }
  return true;
};

/** Returns true if the two sets of bindings contain the same information. */
const bindingsesMatch = (actual: Bindings[], expected: Bindings[]) => {
  const sortedBindingses = (bindings: Bindings[]): Bindings[] =>
    sortBy(bindings, (b) =>
      sortBy([...b.keys()], (v) => v.value).map((v) => termToString(b.get(v)))
    );

  const sortedActual = sortedBindingses(actual);
  const sortedExpected = sortedBindingses(expected);

  return !zip(sortedActual, sortedExpected).find(([a, e]) => !a?.equals(e));
};

export const toBeBindingsEqualTo: MatcherFunction<
  [expectedBindings: ExpectedBindings]
> = function (actual, expected) {
  if (!isIterableOf(actual, isBindings)) {
    throw new Error(
      `Expected a bindings collection, but got: ${this.utils.stringify(actual)}`
    );
  }

  const df = new DataFactory();
  const bf = new BindingsFactory(df);

  const actualBindingses = [...actual];

  // We assume here that every Bindings has the same variables (which it should)
  const actualVariableNames = [...(actualBindingses[0]?.keys() ?? [])].map(
    (v) => v.value
  );

  const [expectedVariableNames = [], ...expectedBindingRows] = expected;

  const expectedBindingses = expectedBindingRows.map(
    (row) =>
      bf.bindings(
        expectedVariableNames.map((name, i) => [
          df.variable(name),
          stringToTerm(row[i]),
        ])
        // Type assertion to work around: https://github.com/comunica/comunica/pull/1200
      ) as unknown as Bindings
  );

  const pass = bindingsesMatch(actualBindingses, expectedBindingses);

  const allVariableNames = new Set<string>([
    ...actualVariableNames,
    ...expectedVariableNames,
  ]);

  const sortedVariableNames = sortBy(
    [...allVariableNames],
    [
      (varName) => {
        const index = expectedVariableNames.indexOf(varName);
        return index === -1 ? expectedVariableNames.length : index;
      },
      identity,
    ]
  );

  // Tracks the longest widths of cells across both actual and expected, so they
  // match.
  const columnsConfig: Record<number, Mutable<ColumnUserConfig>> = {};

  const tableData = (bindings: Bindings[]) => [
    sortedVariableNames,
    ...bindings.map((b) =>
      sortedVariableNames.map((varName, i) => {
        const value = termToString(b.get(varName)) ?? "";
        const columnConfig = (columnsConfig[i] ??= {});
        columnConfig.width = Math.max(
          columnConfig.width ?? 1,
          value.length,
          varName.length
        );
        return value;
      })
    ),
  ];

  const { actual: actualData, expected: expectedData } = mapValues(
    { actual: actualBindingses, expected: expectedBindingses },
    tableData
  );

  const makeTable = (data: string[][]) => {
    return `${data.length - 1} bindings:\n${table(data, {
      columns: columnsConfig,
    })}`;
  };

  const { actual: actualTable, expected: expectedTable } = mapValues(
    { actual: actualData, expected: expectedData },
    makeTable
  );

  return {
    ...matchers.toBe.call(this, actualTable, expectedTable),
    pass,
  };
};

expect.extend({ toBeBindingsEqualTo });

declare module "expect" {
  interface AsymmetricMatchers {
    toBeBindingsEqualTo(
      expectedBindings: ExpectedBindings
    ): AsymmetricMatcher<string>;
  }

  interface Matchers<R> {
    toBeBindingsEqualTo(expectedBindings: ExpectedBindings): R;
  }
}
