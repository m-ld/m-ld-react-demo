import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { frameQuery, sparqlForFrame } from "./frameQuery";
import { ContextDefinition, JsonLdDocument } from "jsonld";
import "./toBeSparqlEqualTo";

// Workaround for jsonld.js: https://github.com/digitalbazaar/jsonld.js/issues/516#issuecomment-1485912565
import { kyPromise } from "@digitalbazaar/http-client";
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
      "@id": "http://swapi.dev/api/people/1",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
    };

    const query = {
      "@context": context,
      "@id": "http://swapi.dev/api/people/1",
      name: {},
      height: {},
    };

    expect(await sparqlForFrame(query)).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      CONSTRUCT WHERE {
        <http://swapi.dev/api/people/1> swapi:height ?b0;
          swapi:name ?b1.
      }
    `);

    expect(await frameQuery(input, query)).toStrictEqual({
      "@context": context,
      "@id": "http://swapi.dev/api/people/1",
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
          "@id": "http://swapi.dev/api/people/1",
          name: "Luke Skywalker",
          height: "172",
          mass: "77",
          hair_color: "blond",
          skin_color: "fair",
          eye_color: "blue",
        },
        {
          "@id": "http://swapi.dev/api/people/5",
          name: "Leia Organa",
          height: "150",
          mass: "49",
          hair_color: "brown",
          skin_color: "light",
          eye_color: "brown",
        },
        {
          "@id": "http://swapi.dev/api/people/6",
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
          "@id": "http://swapi.dev/api/people/1",
          name: "Luke Skywalker",
          height: "172",
          eye_color: "blue",
        },
        {
          "@id": "http://swapi.dev/api/people/6",
          name: "Owen Lars",
          height: "178",
          eye_color: "blue",
        },
      ],
    } satisfies JsonLdDocument);
  });
});
