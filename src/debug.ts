import { table } from "table";
import { engine, readAll } from "./frameQuery";
import { Quad } from "@rdfjs/types";
import { Parser, Store, Writer } from "n3";
import { termToString } from "rdf-string";
import { sortBy } from "lodash";
import { ConsoleLogger } from "./logger";
import { Algebra } from "sparqlalgebrajs";
import { toRDF } from "jsonld";
import { Variable } from "sparqljs";

function source(data: Quad[]) {
  const store = new Store();
  store.addQuads(data);
  return store;
}

export async function debug(
  inputRdf: string | Quad[],
  query: string,
  /*
   * A sort order for variables in the returned bindings (when the query is a
   * SELECT). Other bindings will appear after those in the given sort order.
   */
  sorting: string[] = []
) {
  const parser = new Parser();
  const inputQuads =
    typeof inputRdf === "string" ? parser.parse(inputRdf) : inputRdf;

  if (query.includes("CONSTRUCT")) {
    const quadsStream = await engine.queryQuads(query, {
      sources: [source(inputQuads)],
    });
    const writer = new Writer();
    const quads = await readAll(quadsStream);
    return `${quads.length} quads:\n${writer.quadsToString(quads)}`;
  } else {
    const bindingsStream = await engine.queryBindings(query, {
      sources: [source(inputQuads)],
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

(async function () {
  const input = {
    "@context": {
      "@vocab": "http://swapi.dev/documentation#",
      vehicles: { "@container": "@list", "@type": "@id" },
      master: { "@type": "@id" },
    },
    "@graph": [
      {
        "@id": "http://swapi.dev/api/people/1/",
        name: "Luke Skywalker",
        height: "172",
        mass: "77",
        hair_color: "blond",
        skin_color: "fair",
        eye_color: "blue",
        master: "http://swapi.dev/api/people/10/",
        // master: "_:obiwan",
        vehicles: [
          "http://swapi.dev/api/vehicles/14/",
          "http://swapi.dev/api/vehicles/30/",
          "http://swapi.dev/api/vehicles/40/",
        ],
      },
      {
        "@id": "http://swapi.dev/api/people/10/",
        // "@id": "_:obiwan",
        name: "Obi-Wan Kenobi",
        height: "182",
        mass: "77",
        hair_color: "auburn, white",
        skin_color: "fair",
        eye_color: "blue-gray",
        master: "http://swapi.dev/api/people/32/",
        // master: "_:quigon",
        vehicles: ["http://swapi.dev/api/vehicles/38/"],
      },
      {
        "@id": "http://swapi.dev/api/people/32/",
        // "@id": "_:quigon",
        name: "Qui-Gon Jinn",
        height: "193",
        mass: "89",
        hair_color: "brown",
        skin_color: "fair",
        eye_color: "blue",
      },
      {
        "@id": "http://swapi.dev/api/vehicles/14/",
        name: "Snowspeeder",
        model: "t-47 airspeeder",
        manufacturer: "Incom corporation",
      },
      {
        "@id": "http://swapi.dev/api/vehicles/30/",
        name: "Imperial Speeder Bike",
        model: "74-Z speeder bike",
        manufacturer: "Aratech Repulsor Company",
      },
      {
        "@id": "http://swapi.dev/api/vehicles/38/",
        name: "Tribubble bongo",
        model: "Tribubble bongo",
        manufacturer: "Otoh Gunga Bongameken Cooperative",
      },
    ],
  };

  const inputQuads = await toRDF(input);

  const result = await debug(
    inputQuads,
    /* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT ?s ?p ?o ?rest
      WHERE {
        # Pick our targets.
        FILTER(?luke = <http://swapi.dev/api/people/1/>)
        # ?luke swapi:hair_color "blond"

        {
            # Pick our properties.
            VALUES ?p { swapi:name swapi:height swapi:master swapi:vehicles }

            # Get the values.
            ?s ?p ?o .
            
            BIND(?s AS ?luke)
            BIND("" AS ?rest)
        }
        UNION
        {
          # Pick our targets.
          ?luke swapi:master ?s .
          
          # Pick our properties.
          VALUES ?p { swapi:name swapi:master }

          # Get the values.
          ?s ?p ?o .

          BIND("" AS ?rest)
        }
        UNION
        {
          # Pick our targets.
          ?luke swapi:master ?obiwan .
          ?obiwan swapi:master ?s .
          
          # Pick our properties.
          VALUES ?p { swapi:name }

          # Get the values.
          ?s ?p ?o .
        }
        UNION
        {
          # Pick our targets.
          ?luke swapi:vehicles ?list .

          # Get the elements.
          ?list rdf:rest* ?node .
          ?node rdf:first ?element .
          ?node rdf:rest ?rest .

          BIND(?node AS ?s)
          BIND(?element AS ?o)
        }
      }`,
    ["s", "p", "o", "rest"]
  );

  console.log(result);
})();
