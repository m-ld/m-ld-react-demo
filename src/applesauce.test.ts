import fc from "fast-check";
import dataset from "@graphy/memory.dataset.fast";
import { namedNode, quad } from "@graphy/core.data.factory";
import { Observable } from "rxjs";
import { Dataset } from "@rdfjs/types";

// Code under test
// const contains = (text: string, pattern: string) => text.indexOf(pattern) >= 0;

// Properties
// describe("properties", () => {
//   // string text always contains itself
//   it("should always contain itself", () => {
//     fc.assert(fc.property(fc.string(), (text) => contains(text, text)));
//   });
//   // string a + b + c always contains b, whatever the values of a, b and c
//   it("should always contain its substrings", () => {
//     fc.assert(
//       fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
//         // Alternatively: no return statement and direct usage of expect or assert
//         return contains(a + b + c, b);
//       })
//     );
//   });
// });

const patchesOf = (ds: Dataset) =>
  new Observable((subscriber) => {
    subscriber.next({ add: [], remove: [] });
  });

describe("observable of changes to a dataset", () => {
  it("should emit every change to the dataset", () => {
    const ds = dataset();
    ds.add(
      quad(namedNode("subject1"), namedNode("predicate1"), namedNode("object1"))
    );
    const patch$ = patchesOf(ds);
    patch$.subscribe((patch) => {
      expect(patch).toStrictEqual({ add: [], remove: [] });
    });
  });
});

// BOOKMARK: Do we actually want to batch these things up into (potentially
// giant) patches? Would it be better to stream the changes?
