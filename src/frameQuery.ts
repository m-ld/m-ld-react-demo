import { JsonLdDocument, frame, toRDF, fromRDF, NodeObject } from "jsonld";
import { BaseQuad, Quad, Stream } from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Algebra, Factory as SparqlFactory } from "sparqlalgebrajs";
import dataset from "@graphy/memory.dataset.fast";
import { DataFactory } from "rdf-data-factory";

// TODO: Is it bad to have these at the module level?
const df = new DataFactory();
const engine = new QueryEngine();

/**
 * Read all quads from an RDF Stream and return them as a promise of an array.
 */
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

const queryForFrame = async (frameDocument: NodeObject) => {
  const sparql = new SparqlFactory();

  const frameRdf = (
    await toRDF(frameDocument, { produceGeneralizedRdf: true })
  ).map(fixQuad);

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
  return algebraQuery;
};

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

const query = async (input: JsonLdDocument, frameDocument: NodeObject) => {
  const algebraQuery: Algebra.Construct = await queryForFrame(frameDocument);

  const inputRdf = (await toRDF(input)).map(fixQuad);
  const inputDataset = dataset().addAll(inputRdf);

  const quadsStream = await engine.queryQuads(algebraQuery, {
    sources: [inputDataset],
  });

  return fromRDF(await readAll(quadsStream));
};

export const frameQuery = async (
  input: JsonLdDocument,
  frameDocument: NodeObject
) => frame(await query(input, frameDocument), frameDocument);
