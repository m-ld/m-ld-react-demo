import { JsonLdDocument, frame, toRDF, fromRDF, NodeObject } from "jsonld";
import { BaseQuad, Quad, Stream } from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Algebra, Factory as SparqlFactory, toSparql } from "sparqlalgebrajs";
import dataset from "@graphy/memory.dataset.fast";
import { DataFactory } from "rdf-data-factory";

const engine = new QueryEngine();

const readAll = <Q extends BaseQuad = Quad>(stream: Stream<Q>) => {
  return new Promise<Q[]>((resolve) => {
    const quads: Q[] = [];
    stream
      .on("data", (quad) => {
        quads.push(quad);
      })
      .on("end", () => {
        resolve(quads);
      });
  });
};

const query = async (input: JsonLdDocument, frameDocument: NodeObject) => {
  const df = new DataFactory();
  const sparql = new SparqlFactory();

  // This whole madness is just to cope with the fact that jsonld.toRDF doesn't
  // return real Quads. Namely, they're missing the `.equals()` methods.
  const fixQuad = (q: Quad) => {
    // @ts-ignore
    const fixTerm: typeof df.fromTerm = (term) => {
      return term.termType === "Literal"
        ? df.literal(term.value, term.datatype)
        : df.fromTerm(term);
    };

    const quad = df.quad(
      fixTerm(q.subject),
      fixTerm(q.predicate),
      fixTerm(q.object),
      fixTerm(q.graph)
    );
    return quad;
  };

  const frameRdf = (
    await toRDF(frameDocument, { produceGeneralizedRdf: true })
  ).map(fixQuad);
  const inputRdf = (await toRDF(input)).map(fixQuad);
  const inputDataset = dataset().addAll(inputRdf);

  const patterns = frameRdf.map((frameQuad) => {
    return sparql.createPattern(
      frameQuad.subject,
      frameQuad.predicate,
      // Swap blank nodes out for variables, so the engine resolves actual
      // values for them.
      frameQuad.object.termType === "BlankNode"
        ? df.variable(frameQuad.object.value)
        : frameQuad.object
    );
  });

  const algebraQuery: Algebra.Construct = sparql.createConstruct(
    sparql.createBgp(patterns),
    patterns
  );

  const quadsStream = await engine.queryQuads(toSparql(algebraQuery), {
    sources: [inputDataset],
  });

  return fromRDF(await readAll(quadsStream));
};

const frameQuery = async (input: JsonLdDocument, frameDocument: NodeObject) =>
  frame(await query(input, frameDocument), frameDocument);

const context = {
  dcterms: "http://purl.org/dc/terms/",
  ex: "http://example.org/vocab#",
  "ex:contains": { "@type": "@id" },
};

const input = {
  "@context": context,
  "@graph": [
    {
      "@id": "http://example.org/test/#library",
      "@type": "ex:Library",
      "ex:contains": "http://example.org/test#book",
    },
    {
      "@id": "http://example.org/test#book",
      "@type": "ex:Book",
      "dcterms:contributor": "Writer",
      "dcterms:title": "My Book",
      "ex:contains": "http://example.org/test#chapter",
    },
    {
      "@id": "http://example.org/test#chapter",
      "@type": "ex:Chapter",
      "dcterms:description": "Fun",
      "dcterms:title": "Chapter One",
    },
  ],
};

// These tests shouldn't take long. If they do, they're probably stuck somewhere
// async, so fail fast.
jest.setTimeout(100);

describe("frame queries", () => {
  // xit("should fetch and frame everything", async () => {
  //   expect(
  //     await frameQuery(input, {
  //       "@context": context,
  //       "@id": "http://example.org/test/#library",
  //       "@type": {},
  //       "ex:contains": {
  //         "@id": {},
  //         "@type": {},
  //         "dcterms:contributor": {},
  //         "dcterms:title": {},
  //         "ex:contains": {
  //           "@id": {},
  //           "@type": {},
  //           "dcterms:description": {},
  //           "dcterms:title": {},
  //         },
  //       },
  //     })
  //   ).toStrictEqual({
  //     "@context": context,
  //     "@id": "http://example.org/test/#library",
  //     "@type": "ex:Library",
  //     "ex:contains": {
  //       "@id": "http://example.org/test#book",
  //       "@type": "ex:Book",
  //       "dcterms:contributor": "Writer",
  //       "dcterms:title": "My Book",
  //       "ex:contains": {
  //         "@id": "http://example.org/test#chapter",
  //         "@type": "ex:Chapter",
  //         "dcterms:description": "Fun",
  //         "dcterms:title": "Chapter One",
  //       },
  //     },
  //   });
  // });

  it("should fetch and frame a single property by @id", async () => {
    expect(
      await frameQuery(input, {
        "@context": context,
        "@id": "http://example.org/test#book",
        "dcterms:title": {},
      })
    ).toStrictEqual({
      "@context": context,
      "@id": "http://example.org/test#book",
      "dcterms:title": "My Book",
    });
  });

  it("should fetch and frame multiple properties by @id", async () => {
    expect(
      await frameQuery(input, {
        "@context": context,
        "@id": "http://example.org/test#book",
        "dcterms:title": {},
        "dcterms:contributor": {},
      })
    ).toStrictEqual({
      "@context": context,
      "@id": "http://example.org/test#book",
      "dcterms:title": "My Book",
      "dcterms:contributor": "Writer",
    });
  });

  it("should fetch and frame by other properties", async () => {
    expect(
      await frameQuery(input, {
        "@context": context,
        "dcterms:title": "My Book",
        "dcterms:contributor": {},
      })
    ).toStrictEqual({
      "@context": context,
      "@id": "http://example.org/test#book",
      "dcterms:title": "My Book",
      "dcterms:contributor": "Writer",
    });
  });

  it("should fetch and frame child objects", async () => {
    expect(
      await frameQuery(input, {
        "@context": context,
        "@id": "http://example.org/test/#library",
        "ex:contains": {},
      })
    ).toStrictEqual({
      "@context": context,
      "@id": "http://example.org/test/#library",
      "ex:contains": "http://example.org/test#book",
    });
  });

  it("should fetch and frame within nested objects", async () => {
    expect(
      await frameQuery(input, {
        "@context": context,
        "@id": "http://example.org/test/#library",
        "ex:contains": {
          "dcterms:title": {},
        },
      })
    ).toStrictEqual({
      "@context": context,
      "@id": "http://example.org/test/#library",
      "ex:contains": {
        "@id": "http://example.org/test#book",
        "dcterms:title": "My Book",
      },
    });
  });
});
