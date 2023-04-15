import { ResultStream } from "@rdfjs/types";

/**
 * Read all results from an RDF Stream and return them as a promise of an array.
 */

export const readAll = <R>(stream: ResultStream<R>) => {
  return new Promise<R[]>((resolve) => {
    const quads: R[] = [];
    stream
      .on("data", (quad) => {
        quads.push(quad);
      })
      .on("end", () => {
        resolve(quads);
      });
  });
};
