import { JsonLdDocument, frame, toRDF, fromRDF, NodeObject } from "jsonld";
import {
  BaseQuad,
  Quad,
  Stream,
  Term,
  BlankNode,
  Variable,
} from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Algebra, Factory as SparqlFactory } from "sparqlalgebrajs";
import { DataFactory } from "rdf-data-factory";
import { dataset } from "./fixedDataset";

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

export const sparqlForFrame = async (frameDocument: NodeObject) => {
  const sparql = new SparqlFactory();

  const frameRdf = (
    await toRDF(frameDocument, { produceGeneralizedRdf: true })
  ).map(fixQuad);

  const patterns = frameRdf.map((frameQuad) => {
    return sparql.createPattern(
      // Swap blank nodes out for variables, so the engine resolves actual
      // values for them.
      blankToVariable(frameQuad.subject),
      blankToVariable(frameQuad.predicate),
      blankToVariable(frameQuad.object)
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
  const algebraQuery: Algebra.Construct = await sparqlForFrame(frameDocument);

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

function blankToVariable(
  term: Term
): typeof term extends BlankNode ? Variable : typeof term {
  // Naively reuse blank node names as variable names. This is safe if and only
  // if we assume there are no existing variables—if there are any, the names
  // could clash. As of this writing, we don't have any way to specify variables
  // in the input query other than blank nodes, so this is fine.
  //
  // If we want to be more sophisticated, we can use sparqlalgebrajs's
  // `Util.createUniqueVariable()`, which sparqlalgebrajs itself uses for a
  // similar function, used optionally from within `translate()`.
  //
  // https://github.com/joachimvh/SPARQLAlgebra.js/blob/36ac499dc02b6a287188000a1bebf51b0cc5e33b/lib/sparqlAlgebra.ts#L60
  // https://github.com/joachimvh/SPARQLAlgebra.js/blob/36ac499dc02b6a287188000a1bebf51b0cc5e33b/lib/sparqlAlgebra.ts#L931-L944
  return term.termType === "BlankNode" ? df.variable(term.value) : term;
}
