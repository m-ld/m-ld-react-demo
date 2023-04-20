import { table } from "table";
import { readAll } from "./readAll";
import { Quad, Term } from "@rdfjs/types";
import { Parser, Store, Writer } from "n3";
import { termToString } from "rdf-string";
import { sortBy } from "lodash";
import { DataFactory } from "rdf-data-factory";
import { ConsoleLogger } from "./logger";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";

// TODO: Is it bad to have this at the module level?
const engine = new QueryEngine();

function source(data: Quad[]) {
  const store = new Store();
  store.addQuads(data);
  return store;
}

const blankify = (inputQuads: Quad[]) => {
  const df = new DataFactory();

  const blankifyTerm = <T extends Term>(term: T) =>
    term.termType === "NamedNode" ? df.blankNode(term.value) : term;

  return inputQuads.map((q) =>
    df.quad(
      blankifyTerm(q.subject),
      q.predicate,
      blankifyTerm(q.object),
      blankifyTerm(q.graph)
    )
  );
};

export async function debug(
  inputRdf: string | Quad[],
  query: string,
  {
    sorting = [],
    blankNodeMode,
  }: {
    /*
     * A sort order for variables in the returned bindings (when the query is a
     * SELECT). Other bindings will appear after those in the given sort order.
     */
    sorting?: string[];
    /*
     * When true, turns all named nodes in to blank nodes, to exercise a more
     * difficult case. (Some things are easier to query when nodes are
     * guaranteed to be named, because different parts of the query will always
     * find the same name.)
     */
    blankNodeMode?: boolean;
  }
) {
  const parser = new Parser();
  const inputQuads =
    typeof inputRdf === "string" ? parser.parse(inputRdf) : inputRdf;

  const processedInputQuads = blankNodeMode ? blankify(inputQuads) : inputQuads;

  if (query.includes("CONSTRUCT")) {
    const quadsStream = await engine.queryQuads(query, {
      sources: [source(processedInputQuads)],
    });
    const writer = new Writer();
    const quads = await readAll(quadsStream);
    return `${quads.length} quads:\n${writer.quadsToString(quads)}`;
  } else {
    const bindingsStream = await engine.queryBindings(query, {
      sources: [source(processedInputQuads)],
      // log: new ConsoleLogger({ level: "debug" }),
    });

    const bindings = await readAll(bindingsStream);

    const variables = sortBy(
      [...(bindings[0]?.keys() ?? [])],
      [
        (v) => {
          const index = sorting.indexOf(v.value);
          return index === -1 ? sorting.length : index;
        },
        "value",
      ]
    );

    // Adds an extra column to serve as a divider after the sorted columns
    const addDivider = <T>(rowCells: T[]) => {
      if (rowCells.length > sorting.length) {
        const withDivider: Array<T | ""> = [...rowCells];
        withDivider.splice(sorting.length, 0, "");
        return withDivider;
      } else {
        return rowCells;
      }
    };

    const data = variables.length
      ? [
          variables.map((v) => v.value),
          ...bindings.map((b) => variables.map((v) => termToString(b.get(v)))),
        ].map(addDivider)
      : [["<no results>"]];
    return `${bindings.length} bindings:\n${table(data, {
      columns: {
        // Make the divider column as slim as possible, so it's just a double
        // line.
        [sorting.length]: { paddingLeft: 0, paddingRight: 0 },
      },
    })}`;
  }
}
