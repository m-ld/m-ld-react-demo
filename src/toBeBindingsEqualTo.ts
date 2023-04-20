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

/**
 * Returns an array of tables (as strings) presenting each bindingses given.
 * The column widths will match across all tables, to make it easier to compare
 * multple tables generated at once.
 */
export const bindingsTables = <BindingsesList extends Bindings[][]>(
  bindingseses: BindingsesList,
  /**
   * The columns will be ordered by these variable names. Variables not
   * mentioned will appear in alphabetical order after these.
   */
  columnOrder: string[] = []
): { [I in keyof BindingsesList]: string } => {
  const allVariableNames = new Set<string>();

  for (const bindingses of bindingseses) {
    for (const variable of [...(bindingses[0]?.keys() ?? [])]) {
      allVariableNames.add(variable.value);
    }
  }

  const sortedVariableNames = sortBy(
    [...allVariableNames],
    [
      (varName) => {
        const index = columnOrder.indexOf(varName);
        return index === -1 ? columnOrder.length : index;
      },
      identity,
    ]
  );

  // Tracks the longest widths of cells across both actual and expected, so they
  // match.
  const columnsConfig: Record<number, Mutable<ColumnUserConfig>> = {};

  const tableData = (bindingses: Bindings[]) => [
    sortedVariableNames,
    ...sortBy(
      bindingses.map((b) =>
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
      )
    ),
  ];

  const makeTable = (data: string[][]) =>
    `${data.length - 1} bindings:\n${table(data, {
      columns: columnsConfig,
    })}`;

  const tables = bindingseses.map(tableData).map(makeTable);

  // TypeScript isn't great at preserving tuple types through maps. We'll just
  // assert to TS that we have this right (while letting it confirm that the
  // value is at least a `string[]`).
  return tables satisfies string[] as {
    [I in keyof BindingsesList]: string;
  };
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

  const [actualTable, expectedTable] = bindingsTables(
    [actualBindingses, expectedBindingses],
    expectedVariableNames
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
