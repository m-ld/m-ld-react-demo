declare module "@graphy/memory.dataset.fast" {
  import type { Dataset } from "@rdfjs/types";
  function dataset(): DatasetCore;
  export = dataset;
}

declare module "@graphy/core.data.factory" {
  import type { DataFactory } from "@rdfjs/types";
  const factory: DataFactory;
  export = factory;
}
