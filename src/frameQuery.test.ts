import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { frameQuery, sparqlForFrame } from "./frameQuery";
import { ContextDefinition, JsonLdDocument } from "jsonld";
import "./toBeSparqlEqualTo";

// Workaround for jsonld.js: https://github.com/digitalbazaar/jsonld.js/issues/516#issuecomment-1485912565
import { kyPromise } from "@digitalbazaar/http-client";
import { debug } from "./debug";
import { Parser } from "n3";
beforeAll(async () => {
  await kyPromise;
});

// These tests shouldn't take long. If they do, they're probably stuck somewhere
// async, so fail fast.
jest.setTimeout(100);

describe("frame queries", () => {
  it("should fetch and frame literal property values by @id", async () => {
    const context: ContextDefinition = {
      "@vocab": "http://swapi.dev/documentation#",
    };

    const input = {
      "@context": context,
      "@id": "http://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
    };

    const query = {
      "@context": context,
      "@id": "http://swapi.dev/api/people/1/",
      name: {},
      height: {},
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        <http://swapi.dev/api/people/1/> swapi:height ?b0;
          swapi:name ?b1.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": context,
      "@id": "http://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
    } satisfies JsonLdDocument);
  });

  it("should fetch and frame literal property values by properties", async () => {
    const context: ContextDefinition = {
      "@vocab": "http://swapi.dev/documentation#",
    };

    const input: JsonLdDocument = {
      "@context": context,
      "@graph": [
        {
          "@id": "http://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          mass: "77",
          hair_color: "blond",
          skin_color: "fair",
          eye_color: "blue",
        },
        {
          "@id": "http://swapi.dev/api/people/5/",
          name: "Leia Organa",
          height: "150",
          mass: "49",
          hair_color: "brown",
          skin_color: "light",
          eye_color: "brown",
        },
        {
          "@id": "http://swapi.dev/api/people/6/",
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
      PREFIX swapi: <http://swapi.dev/documentation#>
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
          "@id": "http://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
          height: "172",
          eye_color: "blue",
        },
        {
          "@id": "http://swapi.dev/api/people/6/",
          name: "Owen Lars",
          height: "178",
          eye_color: "blue",
        },
      ],
    } satisfies JsonLdDocument);
  });

  it("should TODO: lists", async () => {
    const input: JsonLdDocument = {
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
        vehicles: { "@container": "@list", "@type": "@id" },
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
      "@id": "http://swapi.dev/api/people/1/",
      name: {},
      vehicles: {},
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        <http://swapi.dev/api/people/1/> swapi:name ?b0.
        ?b2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> ?b1;
          <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>.
        <http://swapi.dev/api/people/1/> swapi:vehicles ?b2.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
        vehicles: { "@container": "@list", "@type": "@id" },
      },
      "@graph": [
        {
          "@id": "http://swapi.dev/api/people/1/",
          name: "Luke Skywalker",
        },
      ],
    } satisfies JsonLdDocument);
  });

  it.only("FIGURE OUT QUERY", async () => {
    const input: JsonLdDocument = {
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
        vehicles: { "@container": "@list", "@type": "@id" },
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
      "@id": "http://swapi.dev/api/people/1/",
      name: {},
      vehicles: {},
    };

    const inputTurtle = /* turtle */ `
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#eye_color> "blue" .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#hair_color> "blond" .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#height> "172" .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#mass> "77" .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#name> "Luke Skywalker" .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#skin_color> "fair" .
      _:n0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/14/> .
      _:n0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:n1 .
      _:n1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/30/> .
      _:n1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:n2 .
      _:n2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/40/> .
      _:n2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .
      <http://swapi.dev/api/people/1/> <http://swapi.dev/documentation#vehicles> _:n0 .
      <https://swapi.dev/api/vehicles/14/> <http://swapi.dev/documentation#manufacturer> "Incom corporation" .
      <https://swapi.dev/api/vehicles/14/> <http://swapi.dev/documentation#model> "t-47 airspeeder" .
      <https://swapi.dev/api/vehicles/14/> <http://swapi.dev/documentation#name> "Snowspeeder" .
      <https://swapi.dev/api/vehicles/30/> <http://swapi.dev/documentation#manufacturer> "Aratech Repulsor Company" .
      <https://swapi.dev/api/vehicles/30/> <http://swapi.dev/documentation#model> "74-Z speeder bike" .
      <https://swapi.dev/api/vehicles/30/> <http://swapi.dev/documentation#name> "Imperial Speeder Bike" .
      <http://swapi.dev/api/people/2/> <http://swapi.dev/documentation#vehicles> _:xn0 .
      _:xn0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <ex:somethingElse> .
      _:xn0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .
    `;

    console.log(
      await debug(
        inputTurtle,
        /* sparql */ `
          PREFIX swapi: <http://swapi.dev/documentation#>
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>


          SELECT ?s ?p ?node ?element ?rest ?o #?apple·sauce
          WHERE {
            # BOOKMARK: Can we somehow only bind ?s to the node we're looking at for its queries and then also bind it to deeper things later?
            VALUES ?p { swapi:vehicles swapi:name }

            # Parent filters
            # BIND(<http://swapi.dev/api/people/2/> AS ?s)
            ?s swapi:eye_color "blue" .

            # {
              # Get value
              ?s ?p ?o .
            # }

            # If ?o is a list, get a binding for each node in the list.
            OPTIONAL {
              ?o rdf:rest* ?node .
              ?node rdf:first ?element .
              ?node rdf:rest ?rest .

              # OPTIONAL {
              #   ?first swapi:name ?apple·sauce
              # }
            }
          }
        

          # SELECT ?type ?s ?p ?o ?node ?first ?rest
          # WHERE {
          #   {
          #     SELECT ?type ?s ?p ?o
          #     WHERE {
          #       BIND("property" AS ?type)
          #       # BIND(<http://swapi.dev/api/people/1/> AS ?s)
          #       BIND(swapi:eye_color AS ?p)
          #       BIND("blue" AS ?o)
          #       ?s ?p ?o .
          #     }
          #   }
          #   UNION
          #   {
          #     SELECT ?type ?s ?p ?node ?first ?rest
          #     WHERE {
          #       BIND("list" AS ?type)
          #       # BIND(<http://swapi.dev/api/people/1/> AS ?s)
          #       BIND(swapi:vehicles AS ?p)
          #       ?s ?p ?list .
          #       ?list rdf:rest* ?node .
          #       ?node rdf:first ?first .
          #       ?node rdf:rest ?rest .
          #     }
          #   }
          # }
        `
        //     /* sparql */ `
        //   PREFIX swapi: <http://swapi.dev/documentation#>
        //   PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        //   # Nope, CONSTRUCT is still no good.
        //   CONSTRUCT {
        //     # ?s ?p ?list.
        //     ?node rdf:first ?first.
        //     ?node rdf:rest ?rest.
        //   }
        //   WHERE {
        //     {
        //       SELECT ?type ?s ?p ?list ?node ?first ?rest
        //       WHERE {
        //         BIND("list" AS ?type)
        //         # BIND(<http://swapi.dev/api/people/1/> AS ?s)
        //         BIND(swapi:vehicles AS ?p)
        //         ?s ?p ?list .
        //         ?list rdf:rest* ?node .
        //         ?node rdf:first ?first .
        //         ?node rdf:rest ?rest .
        //       }
        //     }
        //   }
        // `
      )
    );

    expect(1).toBe(2);
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
