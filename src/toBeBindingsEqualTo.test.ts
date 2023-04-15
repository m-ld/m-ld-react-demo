import { describe, expect, it } from "@jest/globals";
import "./toBeSparqlEqualTo";
import "./toBeBindingsEqualTo";
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { readAll } from "./readAll";
import ansiRegex from "./ansiRegex";
import { Bindings } from "@comunica/types";

// Strip color from snapshots, for better readability and for better consistency.
const stripAnsi = (message: string): string => message.replace(ansiRegex(), "");

async function query(query: string) {
  const engine = new QueryEngine();

  const bindingsStream = await engine.queryBindings(query, {
    sources: [new Store()],
  });

  const bindings = await readAll(bindingsStream);
  return bindings;
}

function run(actual: Bindings[], expected: string[][]) {
  try {
    expect(actual).toBeBindingsEqualTo(expected);
  } catch (e) {
    if (!(e instanceof Error))
      throw new Error(`Expect() threw something that wasn't an Error: ${e}`);
    return stripAnsi(e.message);
  }
}

describe("toBeBindingsEqualTo", () => {
  it("matches when the expected matches", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"3"`],
      [`"4"`, `"5"`, `"6"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`undefined`);
  });

  it("matches in any order, in either dimension", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"6"`, `"4"`, `"5"`],
      [`"3"`, `"1"`, `"2"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`undefined`);
  });

  it("shows a diff when it doesn't match", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"4"`],
      [`"4"`, `"5"`, `"6"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

  2 bindings:
  ╔═════╤═════╤═════╗
  ║ a   │ b   │ c   ║
  ╟─────┼─────┼─────╢
- ║ "1" │ "2" │ "4" ║
+ ║ "1" │ "2" │ "3" ║
  ╟─────┼─────┼─────╢
  ║ "4" │ "5" │ "6" ║
  ╚═════╧═════╧═════╝
  ↵"
`);
  });

  it("uses the variable ordering given in the expected values", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c ?d
    WHERE {
      VALUES (?a ?b ?c ?d) {
        ("1" "2" "3" "7")
        ("4" "5" "6" "8")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"4"`, `"1"`, `"2"`],
      [`"6"`, `"4"`, `"5"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 2
+ Received  + 2

  2 bindings:
  ╔═════╤═════╤═════╤═════╗
  ║ c   │ a   │ b   │ d   ║
  ╟─────┼─────┼─────┼─────╢
- ║ "4" │ "1" │ "2" │     ║
+ ║ "3" │ "1" │ "2" │ "7" ║
  ╟─────┼─────┼─────┼─────╢
- ║ "6" │ "4" │ "5" │     ║
+ ║ "6" │ "4" │ "5" │ "8" ║
  ╚═════╧═════╧═════╧═════╝
  ↵"
`);
  });

  it.todo("uses the row ordering given in the expected values");

  it("matches column widths to keep the diff nice", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("11" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"44"`, `"1"`, `"2"`],
      [`"6"`, `"4"`, `"5"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

  2 bindings:
  ╔══════╤══════╤═════╗
  ║ c    │ a    │ b   ║
  ╟──────┼──────┼─────╢
- ║ "44" │ "1"  │ "2" ║
+ ║ "3"  │ "11" │ "2" ║
  ╟──────┼──────┼─────╢
  ║ "6"  │ "4"  │ "5" ║
  ╚══════╧══════╧═════╝
  ↵"
`);
  });
});
