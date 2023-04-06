import { frameQuery } from "./frameQuery";

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
