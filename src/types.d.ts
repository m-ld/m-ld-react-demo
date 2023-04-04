declare module "@graphy/memory.dataset.fast" {
  import { Dataset } from "@rdfjs/types";
  export default function dataset(): Dataset;
}

// Because the DefinitelyTyped definitions are way out of date:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jsonld/index.d.ts
// TODO: Package and push upstream to "@types/jsonld".
declare module "jsonld" {
  import { Quad } from "@rdfjs/types";
  // import {
  //   Frame,
  //   Url,
  //   JsonLdProcessor,
  //   RemoteDocument,
  //   JsonLdObj,
  //   JsonLdArray,
  // } from "./jsonld-spec";
  // import { JsonLdDocument, ContextDefinition } from "./jsonld";
  export * from "jsonld/jsonld";
  // // Some typealiases for better readability and some placeholders
  // type MimeNQuad = "application/n-quads";
  // type Callback<T> = (err: Error, res: T) => void;
  // /*
  //  * Declares interfaces used to type the methods options object.
  //  * The interfaces are usefull to avoid code replication.
  //  */
  // export namespace Options {
  //   interface DocLoader {
  //     documentLoader?:
  //       | ((
  //           url: Url,
  //           callback: (err: Error, remoteDoc: RemoteDocument) => void
  //         ) => Promise<RemoteDocument>)
  //       | undefined;
  //   }
  //   interface Common extends DocLoader {
  //     base?: string | undefined;
  //     expandContext?: ContextDefinition | undefined;
  //   }
  //   interface ExpMap {
  //     // TODO: Figure out type of info
  //     expansionMap?: ((info: any) => any) | undefined;
  //   }
  //   interface Compact extends Common, ExpMap {
  //     compactArrays?: boolean | undefined;
  //     appropriate?: boolean | undefined;
  //     compactToRelative?: boolean | undefined;
  //     graph?: boolean | undefined;
  //     skipExpansion?: boolean | undefined;
  //     expansion?: boolean | undefined;
  //     framing?: boolean | undefined;
  //     // TODO: Figure out type of info
  //     compactionMap?: ((info: any) => void) | undefined;
  //   }
  //   interface Expand extends Common, ExpMap {
  //     keepFreeFloatingNodes?: boolean | undefined;
  //   }
  //   type Flatten = Common;
  //   interface Frame {
  //     embed?: "@last" | "@always" | "@never" | "@link" | undefined;
  //     explicit?: boolean | undefined;
  //     requireAll?: boolean | undefined;
  //     omitDefault?: boolean | undefined;
  //     omitGraph?: boolean | undefined;
  //   }
  //   interface Normalize extends Common {
  //     algorithm?: "URDNA2015" | `URGNA2012` | undefined;
  //     skipExpansion?: boolean | undefined;
  //     expansion?: boolean | undefined;
  //     inputFormat?: MimeNQuad | undefined;
  //     format?: MimeNQuad | undefined;
  //     useNative?: boolean | undefined;
  //   }
  //   interface FromRdf {
  //     format?: MimeNQuad | undefined;
  //     rdfParser?: any;
  //     useRdfType?: boolean | undefined;
  //     useNativeTypes?: boolean | undefined;
  //   }
  //   interface ToRdf extends Common {
  //     skipExpansion?: boolean | undefined;
  //     format?: MimeNQuad | undefined;
  //     produceGeneralizedRdf?: boolean | undefined;
  //   }
  // }
  // export function compact(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition,
  //   options: Options.Compact,
  //   callback: Callback<JsonLdObj>
  // ): void;
  // export function compact(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition,
  //   callback: Callback<JsonLdObj>
  // ): void;
  // export function compact(
  //   input: JsonLdDocument,
  //   ctx?: ContextDefinition,
  //   options?: Options.Compact
  // ): Promise<JsonLdObj>;
  // export function expand(
  //   input: JsonLdDocument,
  //   options: Options.Expand,
  //   callback: Callback<JsonLdArray>
  // ): void;
  // export function expand(
  //   input: JsonLdDocument,
  //   callback: Callback<JsonLdArray>
  // ): void;
  // export function expand(
  //   input: JsonLdDocument,
  //   options?: Options.Expand
  // ): Promise<JsonLdArray>;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition | null,
  //   options: Options.Flatten,
  //   callback: Callback<JsonLdObj>
  // ): void;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition | null,
  //   callback: Callback<JsonLdObj>
  // ): void;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx?: ContextDefinition,
  //   options?: Options.Flatten
  // ): Promise<JsonLdObj>;

  export function frame(
    input: JsonLdDocument,
    frame: Frame,
    options?: Options.Frame
  ): Promise<JsonLdObj>;

  // export function normalize(
  //   input: JsonLdDocument,
  //   options: Options.Normalize,
  //   callback: Callback<string>
  // ): void;
  // export function normalize(
  //   input: JsonLdDocument,
  //   callback: Callback<string>
  // ): void;
  // export function normalize(
  //   input: JsonLdDocument,
  //   options?: Options.Normalize
  // ): Promise<string>;
  // export const canonize: typeof normalize;
  export function fromRDF(
    dataset: Iterable<Quad>,
    options?: Options.FromRdf
  ): Promise<JsonLdArray>;
  export function toRDF(
    input: JsonLdDocument,
    options?: Options.ToRdf
  ): Promise<Quad[]>;
  // export let JsonLdProcessor: JsonLdProcessor;
  // disable autoexport
  // export {};
}

declare module "jsonld/jsonld" {
  /*
   * Types from the jsonld Specification:
   * https://www.w3.org/TR/json-ld11/
   * @version 1.1
   */

  /*
   * Disable automatic exporting.
   * Some of these declarations are not needed externally.
   */
  export {};

  /**
   * A JSON-LD document MUST be valid JSON text as described in [RFC8259],
   * or some format that can be represented in the JSON-LD internal representation
   * that is equivalent to valid JSON text.
   * @see https://www.w3.org/TR/json-ld11/#json-ld-grammar
   */
  export type JsonLdDocument =
    | NodeObject
    | NodeObject[]
    | {
        "@context"?: Keyword["@context"] | undefined;
        "@graph"?: Keyword["@graph"] | undefined;
      };

  /**
   * A node object represents zero or more properties of a node
   * in the graph serialized by the JSON-LD document.
   * @see https://www.w3.org/TR/json-ld11/#node-objects
   */
  export interface NodeObject {
    "@context"?: Keyword["@context"] | undefined;
    "@id"?: Keyword["@id"] | undefined;
    "@included"?: Keyword["@included"] | undefined;
    "@graph"?: OrArray<NodeObject> | undefined;
    "@nest"?: OrArray<JsonObject> | undefined;
    "@type"?: OrArray<Keyword["@type"]> | undefined;
    "@reverse"?: { [key: string]: Keyword["@reverse"] } | undefined;
    "@index"?: Keyword["@index"] | undefined;
    [key: string]:
      | OrArray<
          | null
          | boolean
          | number
          | string
          | NodeObject
          | GraphObject
          | ValueObject
          | ListObject
          | SetObject
        >
      | LanguageMap
      | IndexMap
      | IncludedBlock
      | IdMap
      | TypeMap
      | NodeObject[keyof NodeObject];
  }

  /**
   * A graph object represents a named graph, which MAY include an explicit graph name.
   * @see https://www.w3.org/TR/json-ld11/#graph-objects
   */
  export interface GraphObject {
    "@graph": OrArray<NodeObject>;
    "@index"?: Keyword["@index"] | undefined;
    "@id"?: Keyword["@id"] | undefined;
    "@context"?: Keyword["@context"] | undefined;
  }

  /**
   * A value object is used to explicitly associate a type or a language with a value
   * to create a typed value or a language-tagged string and possibly associate a base direction.
   * @see https://www.w3.org/TR/json-ld11/#value-objects
   */
  export type ValueObject = {
    "@index"?: Keyword["@index"] | undefined;
    "@context"?: Keyword["@context"] | undefined;
  } & (
    | {
        "@value": Keyword["@value"];
        "@language"?: Keyword["@language"] | undefined;
        "@direction"?: Keyword["@direction"] | undefined;
      }
    | {
        "@value": Keyword["@value"];
        "@type": Keyword["@type"];
      }
    | {
        "@value": Keyword["@value"] | JsonObject | JsonArray;
        "@type": "@json";
      }
  );

  /**
   * A list represents an ordered set of values.
   * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
   */
  export interface ListObject {
    "@list": Keyword["@list"];
    "@index"?: Keyword["@index"] | undefined;
  }

  /**
   * A set represents an unordered set of values.
   * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
   */
  export interface SetObject {
    "@set": Keyword["@set"];
    "@index"?: Keyword["@index"] | undefined;
  }

  /**
   * A language map is used to associate a language with a value in a way that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#language-maps
   */
  export interface LanguageMap {
    [key: string]: null | string | string[];
  }

  /**
   * An index map allows keys that have no semantic meaning, but should be preserved regardless,
   * to be used in JSON-LD documents.
   * @see https://www.w3.org/TR/json-ld11/#index-maps
   */
  export interface IndexMap {
    [key: string]: OrArray<
      | null
      | boolean
      | number
      | string
      | NodeObject
      | ValueObject
      | ListObject
      | SetObject
    >;
  }

  /**
   * An id map is used to associate an IRI with a value that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#id-maps
   */
  export interface IdMap {
    [key: string]: NodeObject;
  }

  /**
   * A type map is used to associate an IRI with a value that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#type-maps
   */
  export interface TypeMap {
    [key: string]: string | NodeObject;
  }

  /**
   * An included block is used to provide a set of node objects.
   * @see https://www.w3.org/TR/json-ld11/#included-blocks
   */
  export type IncludedBlock = OrArray<NodeObject>;

  /**
   * A context definition defines a local context in a node object.
   * @see https://www.w3.org/TR/json-ld11/#context-definitions
   */
  export interface ContextDefinition {
    "@base"?: Keyword["@base"] | undefined;
    "@direction"?: Keyword["@direction"] | undefined;
    "@import"?: Keyword["@import"] | undefined;
    "@language"?: Keyword["@language"] | undefined;
    "@propagate"?: Keyword["@propagate"] | undefined;
    "@protected"?: Keyword["@protected"] | undefined;
    "@type"?:
      | {
          "@container": "@set";
          "@protected"?: Keyword["@protected"] | undefined;
        }
      | undefined;
    "@version"?: Keyword["@version"] | undefined;
    "@vocab"?: Keyword["@vocab"] | undefined;
    [key: string]:
      | null
      | string
      | ExpandedTermDefinition
      | ContextDefinition[keyof ContextDefinition];
  }

  /**
   * An expanded term definition is used to describe the mapping between a term
   * and its expanded identifier, as well as other properties of the value
   * associated with the term when it is used as key in a node object.
   * @see https://www.w3.org/TR/json-ld11/#expanded-term-definition
   */
  export type ExpandedTermDefinition = {
    "@type"?: "@id" | "@json" | "@none" | "@vocab" | string | undefined;
    "@language"?: Keyword["@language"] | undefined;
    "@index"?: Keyword["@index"] | undefined;
    "@context"?: ContextDefinition | undefined;
    "@prefix"?: Keyword["@prefix"] | undefined;
    "@propagate"?: Keyword["@propagate"] | undefined;
    "@protected"?: Keyword["@protected"] | undefined;
  } & (
    | {
        "@id"?: Keyword["@id"] | null | undefined;
        "@nest"?: "@nest" | string | undefined;
        "@container"?: Keyword["@container"] | undefined;
      }
    | {
        "@reverse": Keyword["@reverse"];
        "@container"?: "@set" | "@index" | null | undefined;
      }
  );

  /**
   * A list of keywords and their types.
   * Only used for internal reference; not an actual interface.
   * Not for export.
   * @see https://www.w3.org/TR/json-ld/#keywords
   */
  // tslint:disable-next-line:interface-over-type-literal
  type Keyword = {
    "@base": string | null;
    "@container":
      | OrArray<"@list" | "@set" | ContainerType>
      | ContainerTypeArray
      | null;
    "@context": OrArray<null | string | ContextDefinition>;
    "@direction": "ltr" | "rtl" | null;
    "@graph": OrArray<ValueObject | NodeObject>;
    "@id": OrArray<string>;
    "@import": string;
    "@included": IncludedBlock;
    "@index": string;
    "@json": "@json";
    "@language": string;
    "@list": OrArray<
      null | boolean | number | string | NodeObject | ValueObject
    >;
    "@nest": object;
    "@none": "@none";
    "@prefix": boolean;
    "@propagate": boolean;
    "@protected": boolean;
    "@reverse": string;
    "@set": OrArray<
      null | boolean | number | string | NodeObject | ValueObject
    >;
    "@type": string;
    "@value": null | boolean | number | string;
    "@version": "1.1";
    "@vocab": string | null;
  };

  /*
   * Helper Types
   * (not for export)
   */
  type OrArray<T> = T | T[];
  type ContainerType = "@language" | "@index" | "@id" | "@graph" | "@type";
  type ContainerTypeArray =
    | ["@graph", "@id"]
    | ["@id", "@graph"]
    | ["@set", "@graph", "@id"]
    | ["@set", "@id", "@graph"]
    | ["@graph", "@set", "@id"]
    | ["@id", "@set", "@graph"]
    | ["@graph", "@id", "@set"]
    | ["@id", "@graph", "@set"]
    | ["@set", ContainerType]
    | [ContainerType, "@set"];

  /*
   * JSON Types
   * (not for export)
   */
  type JsonPrimitive = string | number | boolean | null;
  interface JsonArray extends Array<JsonValue> {}
  interface JsonObject {
    [key: string]: JsonValue | undefined;
  }
  type JsonValue = JsonPrimitive | JsonArray | JsonObject;
}
