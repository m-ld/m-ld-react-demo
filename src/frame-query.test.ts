import { JsonLdDocument, frame, toRDF, fromRDF } from "jsonld";
import dataset from "@graphy/memory.dataset.fast";
import { Dataset, Quad, Stream, Term } from "@rdfjs/types";

/**
 * Returns `null` (interpreted as a wildcard for `match()`) if `term` is a
 * BlankNode; otherwise returns the node.
 */
const wildcarded = (term: Term) =>
  term.termType === "BlankNode" ? null : term;

const query = async (input: JsonLdDocument, frameDocument: JsonLdDocument) => {
  const frameRdf = await toRDF(frameDocument);
  const inputRdf = await toRDF(input);
  const inputDataset = dataset().addAll(inputRdf);

  // This does N `match()`es on `inputDataset`, which may be significantly less
  // efficient than a properly planned query.
  const outputDataset = frameRdf.reduce<Dataset>(
    (acc, quad) =>
      acc.union(
        inputDataset.match(
          wildcarded(quad.subject),
          wildcarded(quad.predicate),
          wildcarded(quad.object)
        )
      ),
    dataset()
  );

  return fromRDF(outputDataset);
};

const frameQuery = async (
  input: JsonLdDocument,
  frameDocument: JsonLdDocument
) => frame(await query(input, frameDocument), frameDocument);

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

const allQuads = (stream: Stream) => {
  return new Promise<Quad[]>((resolve) => {
    const quads: Quad[] = [];
    stream
      .on("data", (quad) => {
        console.log(quad);
        quads.push(quad);
      })
      .on("end", () => {
        console.log(quads);
        resolve(quads);
      });
  });
};

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
