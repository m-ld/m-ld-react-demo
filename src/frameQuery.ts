import { JsonLdDocument, frame, toRDF, fromRDF, NodeObject } from "jsonld";
import { BaseQuad, Quad, Stream } from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Algebra, Factory as SparqlFactory } from "sparqlalgebrajs";
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

  const quadsStream = await engine.queryQuads(algebraQuery, {
    sources: [inputDataset],
  });

  return fromRDF(await readAll(quadsStream));
};

export const frameQuery = async (
  input: JsonLdDocument,
  frameDocument: NodeObject
) => frame(await query(input, frameDocument), frameDocument);
