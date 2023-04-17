import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { frameQuery, sparqlForFrame } from "./frameQuery";
import { ContextDefinition, JsonLdDocument, toRDF } from "jsonld";
import "./toBeSparqlEqualTo";
import "./toBeBindingsEqualTo";
import { kyPromise } from "@digitalbazaar/http-client";
import { debug } from "./debug";
import { Store, Writer } from "n3";
import { Quad } from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { ConsoleLogger } from "./logger";
import { readAll } from "./readAll";

// Workaround for jsonld.js: https://github.com/digitalbazaar/jsonld.js/issues/516#issuecomment-1485912565
beforeAll(async () => {
  await kyPromise;
});

const engine = new QueryEngine();

const input: JsonLdDocument = {
  "@context": {
    "@vocab": "https://swapi.dev/documentation#",
    url: "@id",
    films: { "@type": "@id" },
    /**
     * NOTE: The vehicles property is arbitrarily declared as a @list for this
     * test. It doesn't really make sense for the data, but we need to
     * demonstrate @list behavior, and there's nothing better to choose instead.
     */
    vehicles: { "@container": "@list", "@type": "@id" },
    /**
     * NOTE: This property is not in actual SWAPI at all, but we need a property
     * that points from one Person to another.
     */
    master: { "@type": "@id" },
  },
  "@graph": [
    {
      url: "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      skin_color: "fair",
      eye_color: "blue",
      films: [
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/api/films/6/",
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/api/films/7/",
      ],
      vehicles: [
        "https://swapi.dev/api/vehicles/14/",
        "https://swapi.dev/api/vehicles/30/",
        "https://swapi.dev/api/vehicles/40/",
      ],
      master: "https://swapi.dev/api/people/10/",
    },
    {
      url: "https://swapi.dev/api/people/10/",
      name: "Obi-Wan Kenobi",
      height: "182",
      mass: "77",
      hair_color: "auburn, white",
      skin_color: "fair",
      eye_color: "blue-gray",
      birth_year: "57BBY",
      films: [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/api/films/4/",
        "https://swapi.dev/api/films/5/",
        "https://swapi.dev/api/films/6/",
      ],
      vehicles: ["https://swapi.dev/api/vehicles/38/"],
    },
    {
      url: "https://swapi.dev/api/vehicles/14/",
      name: "Snowspeeder",
      model: "t-47 airspeeder",
      manufacturer: "Incom corporation",
    },
    {
      url: "https://swapi.dev/api/vehicles/30/",
      name: "Imperial Speeder Bike",
      model: "74-Z speeder bike",
      manufacturer: "Aratech Repulsor Company",
    },
    {
      url: "https://swapi.dev/api/vehicles/38/",
      name: "Tribubble bongo",
      model: "Tribubble bongo",
      manufacturer: "Otoh Gunga Bongameken Cooperative",
    },
    {
      url: "https://swapi.dev/api/films/1/",
      title: "A New Hope",
      episode_id: 4,
      release_date: "1977-05-25",
    },
    {
      url: "https://swapi.dev/api/films/2/",
      title: "The Empire Strikes Back",
      episode_id: 5,
      release_date: "1980-05-17",
    },
    {
      url: "https://swapi.dev/api/films/3/",
      title: "Return of the Jedi",
      episode_id: 6,
      release_date: "1983-05-25",
    },
    {
      url: "https://swapi.dev/api/films/4/",
      title: "The Phantom Menace",
      episode_id: 1,
      release_date: "1999-05-19",
    },
    {
      url: "https://swapi.dev/api/films/5/",
      title: "Attack of the Clones",
      episode_id: 2,
      release_date: "2002-05-16",
    },
    {
      url: "https://swapi.dev/api/films/6/",
      title: "Revenge of the Sith",
      episode_id: 3,
      release_date: "2005-05-19",
    },
  ],
};

// These tests shouldn't take long. If they do, they're probably stuck somewhere
// async, so fail fast.
jest.setTimeout(100);

describe("frame queries", () => {
  it("should fetch and frame literal property values by @id", async () => {
    const context: ContextDefinition = {
      "@vocab": "https://swapi.dev/documentation#",
    };

    const input = {
      "@context": context,
      "@id": "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
    };

    const query = {
      "@context": context,
      "@id": "https://swapi.dev/api/people/1/",
      name: {},
      height: {},
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <https://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        <https://swapi.dev/api/people/1/> swapi:height ?b0;
          swapi:name ?b1.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": context,
      "@id": "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
    } satisfies JsonLdDocument);
  });

  it("should fetch and frame literal property values by properties", async () => {
    const context: ContextDefinition = {
      "@vocab": "https://swapi.dev/documentation#",
    };

    const input: JsonLdDocument = {
      "@context": context,
      "@graph": [
        {
          "@id": "https://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          mass: "77",
          hair_color: "blond",
          skin_color: "fair",
          eye_color: "blue",
        },
        {
          "@id": "https://swapi.dev/api/people/5/",
          name: "Leia Organa",
          height: "150",
          mass: "49",
          hair_color: "brown",
          skin_color: "light",
          eye_color: "brown",
        },
        {
          "@id": "https://swapi.dev/api/people/6/",
          name: "Owen Lars",
          height: "178",
          mass: "120",
          hair_color: "brown, grey",
          skin_color: "light",
          eye_color: "blue",
        },
      ],
    };

    const query = {
      "@context": context,
      name: {},
      height: {},
      eye_color: "blue",
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <https://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        ?b0 swapi:eye_color "blue";
          swapi:height ?b1;
          swapi:name ?b2.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": context,
      "@graph": [
        {
          "@id": "https://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          eye_color: "blue",
        },
        {
          "@id": "https://swapi.dev/api/people/6/",
          name: "Owen Lars",
          height: "178",
          eye_color: "blue",
        },
      ],
    } satisfies JsonLdDocument);
  });

  xit("should TODO: lists", async () => {
    const input: JsonLdDocument = {
      "@context": {
        "@vocab": "https://swapi.dev/documentation#",
        vehicles: { "@container": "@list", "@type": "@id" },
      },
      "@graph": [
        {
          "@id": "https://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          mass: "77",
          hair_color: "blond",
          skin_color: "fair",
          eye_color: "blue",
          vehicles: [
            "https://swapi.dev/api/vehicles/14/",
            "https://swapi.dev/api/vehicles/30/",
            "https://swapi.dev/api/vehicles/40/",
          ],
        },
        {
          "@id": "https://swapi.dev/api/vehicles/14/",
          name: "Snowspeeder",
          model: "t-47 airspeeder",
          manufacturer: "Incom corporation",
        },
        {
          "@id": "https://swapi.dev/api/vehicles/30/",
          name: "Imperial Speeder Bike",
          model: "74-Z speeder bike",
          manufacturer: "Aratech Repulsor Company",
        },
      ],
    };

    const query = {
      "@context": input["@context"],
      "@id": "https://swapi.dev/api/people/1/",
      name: {},
      vehicles: {},
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <https://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        <https://swapi.dev/api/people/1/> swapi:name ?b0.
        ?b2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> ?b1;
          <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>.
        <https://swapi.dev/api/people/1/> swapi:vehicles ?b2.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": {
        "@vocab": "https://swapi.dev/documentation#",
        vehicles: { "@container": "@list", "@type": "@id" },
      },
      "@graph": [
        {
          "@id": "https://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
        },
      ],
    } satisfies JsonLdDocument);
  });

  xit("DEBUG LUKE FLUKE", async () => {
    const engine = new QueryEngine();

    const minimalInput = {
      "@context": {
        "@vocab": "https://swapi.dev/documentation#",
      },
      "@graph": [
        {
          "@id": "https://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          hair_color: "blond",
        },
        {
          "@id": "https://swapi.dev/api/people/10/",
          name: "Obi-Wan Kenobi",
          height: "182",
          hair_color: "auburn, white",
        },
        {
          "@id": "https://swapi.dev/api/people/32/",
          name: "Qui-Gon Jinn",
          hair_color: "brown",
        },
      ],
    };

    const query = /* sparql */ `
PREFIX swapi: <https://swapi.dev/documentation#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?s ?p ?o
WHERE {
  ?luke swapi:hair_color "blond" .

  {
    {
      ?s swapi:name ?o .
      BIND(swapi:name AS ?p)
    }
    UNION
    {
      ?s swapi:height ?o .
      BIND(swapi:height AS ?p)
    }

    BIND(?s AS ?luke)
  }
}
`;

    function source(data: Quad[]) {
      const store = new Store();
      store.addQuads(data);
      return store;
    }

    console.log(new Writer().quadsToString(await toRDF(minimalInput)));

    const bindingsStream = await engine.queryBindings(query, {
      sources: [source(await toRDF(minimalInput))],
      log: new ConsoleLogger({ level: "debug" }),
    });

    const bindings = await readAll(bindingsStream);

    expect(bindings).toBeBindingsEqualTo([
      ["s", "p", "o"],
      [
        `https://swapi.dev/api/people/1/`,
        `https://swapi.dev/documentation#name`,
        `"Luke Skywalkerr"`,
      ],
      // [
      //   `https://swapi.dev/api/people/10/`,
      //   `https://swapi.dev/documentation#name`,
      //   `"Obi-Wan Kenobi"`,
      // ],
      // [
      //   `https://swapi.dev/api/people/32/`,
      //   `https://swapi.dev/documentation#name`,
      //   `"Qui-Gon Jinn"`,
      // ],
    ]);
  });

  it("FIGURE OUT QUERY", async () => {
    const query = {
      "@context": input["@context"],
      // For each person with blue eyes...
      eye_color: "blue",
      // ...tell me their name...
      name: {},
      // ...and their height...
      height: {},
      // ...and for each of their films...
      films: {
        // ...tell me its title...
        title: {},
        // ...and its release date.
        release_date: {},
      },
    };

    const inputQuads = await toRDF(input);

    const sparqlQuery = /* sparql */ `
      PREFIX swapi: <https://swapi.dev/documentation#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT 
        # *
        ?s ?p ?o
        # ?rest
      WHERE {
        # Pick our targets.
        # FILTER(?luke = <https://swapi.dev/api/people/1/>)
        ?luke swapi:hair_color "blond"
        # FILTER(?luke = ?luke1)

        # Luke's name, height, and film ids
        {
          # Get the values.
          {
            ?s swapi:name ?o .
            BIND(swapi:name AS ?p)
          }
          UNION
          {
            ?s swapi:height ?o .
            BIND(swapi:height AS ?p)
          }
          UNION
          {
            ?s swapi:films ?o .
            BIND(swapi:films AS ?p)
          }

          BIND(?s AS ?luke)
        }
        UNION
        # Luke's films' titles and release dates
        {
          # Pick our targets.
          ?luke swapi:films ?s .

          # Get the values.
          {
            ?s swapi:title ?o .
            BIND(swapi:title AS ?p)
          }
          UNION
          {
            ?s swapi:release_date ?o .
            BIND(swapi:release_date AS ?p)
          }
        }
      }
    `;

    function source(data: Quad[]) {
      const store = new Store();
      store.addQuads(data);
      return store;
    }

    const bindingsStream = await engine.queryBindings(sparqlQuery, {
      sources: [source(await toRDF(input))],
      log: new ConsoleLogger({ level: "debug" }),
    });

    const bindings = await readAll(bindingsStream);

    expect(bindings).toBeBindingsEqualTo([
      ["s", "p", "o"],
      [
        `https://swapi.dev/api/people/1/`,
        `https://swapi.dev/documentation#name`,
        `"Luke Skywalker"`,
      ],
      [
        `https://swapi.dev/api/people/1/`,
        `https://swapi.dev/documentation#height`,
        `"172"`,
      ],

      [
        "https://swapi.dev/api/people/1/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/1/`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#name",
        `"Obi-Wan Kenobi"`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#height",
        `"182"`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/1/`,
      ],
      [
        "https://swapi.dev/api/vehicles/14/",
        "https://swapi.dev/documentation#name",
        `"Snowspeeder"`,
      ],
      [
        "https://swapi.dev/api/people/1/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/2/`,
      ],
      [
        "https://swapi.dev/api/vehicles/30/",
        "https://swapi.dev/documentation#name",
        `"Imperial Speeder Bike"`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/2/`,
      ],
      [
        "https://swapi.dev/api/vehicles/38/",
        "https://swapi.dev/documentation#name",
        `"Tribubble bongo"`,
      ],
      [
        "https://swapi.dev/api/people/1/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/3/`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/3/`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/4/`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/5/`,
      ],
      [
        "https://swapi.dev/api/people/1/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/6/`,
      ],
      [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/documentation#title",
        `"A New Hope"`,
      ],
      [
        "https://swapi.dev/api/people/10/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/6/`,
      ],
      [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/documentation#release_date",
        `"1977-05-25"`,
      ],
      [
        "https://swapi.dev/api/people/1/",
        "https://swapi.dev/documentation#films",
        `https://swapi.dev/api/films/7/`,
      ],
      [
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/documentation#title",
        `"The Empire Strikes Back"`,
      ],
      [
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/documentation#release_date",
        `"1980-05-17"`,
      ],
      [
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/documentation#title",
        `"Return of the Jedi"`,
      ],
      [
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/documentation#release_date",
        `"1983-05-25"`,
      ],
      [
        "https://swapi.dev/api/films/6/",
        "https://swapi.dev/documentation#title",
        `"Revenge of the Sith"`,
      ],
      [
        "https://swapi.dev/api/films/6/",
        "https://swapi.dev/documentation#release_date",
        `"2005-05-19"`,
      ],
    ]);
  }, 5000);

  //   it("should fetch and frame child objects", async () => {
  //     const query = {
  //       "@context": context,
  //       "@id": "ext:library",
  //       "ex:contains": {},
  //     };

  //     const s = await sparqlForFrame(query);
  //     s.input;

  //     expect(await sparqlForFrame(query)).toEqual(
  //       translate(/* sparql */ `
  //         PREFIX ext: <http://example.org/test#>
  //         PREFIX ex: <http://example.org/vocab#>

  //         CONSTRUCT {
  //           ext:library ex:contains ?b0.
  //         }
  //         WHERE {
  //           ext:library ex:contains ?b0.
  //           }
  //       `)
  //     );

  //     expect(await frameQuery(input, query)).toStrictEqual({
  //       "@context": context,
  //       "@id": "ext:library",
  //       "ex:contains": "ext:book",
  //     });
  //   });

  //   it("should fetch and frame within nested objects", async () => {
  //     const query = {
  //       "@context": context,
  //       "@id": "ext:library",
  //       "ex:contains": {
  //         "dcterms:title": {},
  //       },
  //     };

  //     expect(toSparql(await sparqlForFrame(query))).toMatchInlineSnapshot(`
  // "CONSTRUCT {
  //   _:b0 <http://purl.org/dc/terms/title> ?b1.
  //   <http://example.org/test#library> <http://example.org/vocab#contains> ?b0.
  // }
  // WHERE {
  //   _:b0 <http://purl.org/dc/terms/title> ?b1.
  //   <http://example.org/test#library> <http://example.org/vocab#contains> ?b0.
  // }"
  // `);

  //     // expect(await frameQuery(input, query)).toStrictEqual({
  //     //   "@context": context,
  //     //   "@id": "ext:library",
  //     //   "ex:contains": {
  //     //     "@id": "ext:book",
  //     //     "dcterms:title": "My Book",
  //     //   },
  //     // });
  //   });

  //   it("TODO: super specific test", async () => {
  //     const input = {
  //       "@context": {
  //         "@base": "http://m-ld-react.todomvc.com/",
  //         "@vocab": "https://todomvc.com/vocab/",
  //         icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
  //         items: {
  //           "@container": "@list",
  //         },
  //         "icaltzd:Vtodo": {
  //           "@context": {
  //             "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
  //           },
  //         },
  //       },
  //       "@id": "todoMVCList",
  //       "@type": "TodoList",
  //       "ex:a": "b",
  //       items: [
  //         {
  //           "@type": "icaltzd:Vtodo",
  //           status: "COMPLETED",
  //           summary: "Taste JavaScript",
  //           uid: "DB2CCFFD-1B37-4CA4-81B9-D724DFB70BA8",
  //         },
  //         {
  //           "@type": "icaltzd:Vtodo",
  //           status: "IN-PROCESS",
  //           summary: "Buy Unicorn",
  //           uid: "401BFC3D-7C9B-46CC-A842-6D7C91BFD7EC",
  //         },
  //       ],
  //     };

  //     const query = {
  //       "@context": {
  //         "@base": "http://m-ld-react.todomvc.com/",
  //         "@vocab": "https://todomvc.com/vocab/",
  //       },
  //       "@id": "todoMVCList",
  //       "ex:a": {},
  //       items: {
  //         "@list": {
  //           // "@context": {
  //           //   "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
  //           // },
  //           // // Do we always get an id anyhow?
  //           // // "@id": {},
  //           // completed: {},
  //         },
  //       },
  //     };

  //     // expect(await sparqlForFrame(query)).toEqual(
  //     //   translate(/* sparql */ `
  //     //     PREFIX ext: <http://example.org/test#>
  //     //     PREFIX ex: <http://example.org/vocab#>

  //     //     CONSTRUCT {
  //     //       ext:library ex:contains ?b0.
  //     //     }
  //     //     WHERE {
  //     //       ext:library ex:contains ?b0.
  //     //     }
  //     //   `)
  //     // );

  //     // TODO: Funky types
  //     expect(await frameQuery(input as JsonLdDocument, query)).toStrictEqual({
  //       "@context": {
  //         "@base": "http://m-ld-react.todomvc.com/",
  //         "@vocab": "https://todomvc.com/vocab/",
  //       },
  //       "@id": "todoMVCList",
  //       "ex:a": "b",
  //       items: {},
  //     });
  //   });

  // test("REPRO", async () => {
  //   const df = new DataFactory();

  //   expect(
  //     await fromRDF([
  //       df.quad(
  //         // df.namedNode("ex:subject"),
  //         df.blankNode("abc"),
  //         df.namedNode("ex:predicate"),
  //         df.namedNode("ex:object")
  //       ),
  //     ])
  //   ).toStrictEqual([
  //     { "@id": someBlankNodeId, "ex:predicate": [{ "@id": "ex:object" }] },
  //   ]);
  // });

  // test("REPRO2", async () => {
  //   const quads = await toRDF([
  //     { "@id": "ex:subject", "ex:predicate": [{ "ex:predicate": "value" }] },
  //   ]);

  //   expect(await fromRDF(quads)).toStrictEqual([
  //     { "@id": "ex:subject", "ex:predicate": [{ "ex:predicate": "value" }] },
  //   ]);
  // });
});
