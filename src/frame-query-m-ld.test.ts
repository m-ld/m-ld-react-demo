import { test, fc } from "@fast-check/jest";
// import { Random, string } from "fast-check";
import { NullRemotes } from "./NullRemotes";
import { clone, uuid } from "@m-ld/m-ld";
import { MemoryLevel } from "memory-level";
// import { expand, ValidationError } from "jsonld";
// import { xoroshiro128plus } from "pure-rand";

// Workaround: https://github.com/digitalbazaar/jsonld.js/issues/516#issuecomment-1485912565
// @ts-ignore
import { kyPromise } from "@digitalbazaar/http-client";
beforeAll(async () => {
  await kyPromise;
});

// const DATA = {
//   "@id": "abc",
//   foo: "bar",
// };

const testClone = async (data) => {
  const meld = await clone(new MemoryLevel(), NullRemotes, {
    "@id": uuid(),
    "@domain": "test.example.org",
    genesis: true,
  });

  await meld.write(data);

  return meld;
};

// test("TODO", async () => {
//   const meld = await testClone();

//   const data = await meld.get("abc");
//   expect(data).toStrictEqual({
//     "@id": "abc",
//     foo: "bar",
//   });
// });

const jsonLdDocument = () => fc.dictionary(fc.string(), fc.string());

// const r = new Random(xoroshiro128plus(1));

// string().generate(r, undefined).value; /*?*/

it("foo", async () => {
  const m = await testClone({ abc: 123 });
  const data = await m.read({
    "@construct": { abc: 123 },
    // "@where": { abc: 123 },
  });
  console.log(data);
});

// describe("jsonLdDocument() arbitrary", () => {
//   test.prop([jsonLdDocument()])("TODO", async (doc) => {
//     await expect(expand(doc, { safe: true })).resolves.not.toThrow();
//   });
//   //   it("TODO", async () => {
//   //     await fc.assert(
//   //       fc.asyncProperty(jsonLdDocument(), async (doc) => {
//   //         await expect(expand(doc, { safe: true })).resolves.not.toThrow();
//   //       })
//   //     );
//   //   });
// });

// describe("TODO", () => {
//   describe("2.1 Framing", () => {
//     describe("2.1.1 Matching on Properties", () => {
//       //
//     });
//   });
// });

// Properties of frame-query:
// * The result contains exactly the matched triples
// * The result is framed by the frame
