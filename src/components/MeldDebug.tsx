import JSON5 from "json5";
import { useEffect, useState } from "react";
import { Quad, Stream } from "@rdfjs/types";
import { MeldReadState } from "@m-ld/m-ld";
import N3 from "n3";
import { useMeld } from "@/hooks/useMeld";
import { prettyPrintJson } from "pretty-print-json";

import { query as runQuery } from "xql";

import type { JsonValue } from "type-fest";
import Head from "next/head";

export const MeldDebug = ({
  prefixes,
}: {
  prefixes?: N3.WriterOptions["prefixes"];
}) => (
  <>
    <Query />
    <Turtle prefixes={prefixes} />
  </>
);

const INITIAL_QUERY = `[
  {
    "@context": {
      "icaltzd": "http://www.w3.org/2002/12/cal/icaltzd#"
    },
    "icaltzd:summary": "?",
    "icaltzd:status": "?"
  }
]
`;

const parseQuery = (queryString: string): JsonValue | undefined => {
  try {
    return JSON5.parse(queryString);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return undefined;
    } else {
      throw e;
    }
  }
};

const Query = () => {
  const [queryString, setQueryString] = useState(INITIAL_QUERY);
  const [query, setQuery] = useState<JsonValue>({});
  const [valid, setValid] = useState(true);

  useEffect(() => {
    const nextQuery = parseQuery(queryString);
    if (nextQuery) {
      setQuery(nextQuery);
      setValid(true);
    } else {
      setValid(false);
    }
  }, [queryString]);

  return (
    <>
      <textarea
        value={queryString}
        onChange={(e) => setQueryString(e.target.value)}
        style={{
          width: "100%",
          height: "200px",
          boxShadow: "none",
          outline: valid ? "none" : "1px solid red",
        }}
      />
      <QueryResults query={query} />
    </>
  );
};

const QueryResults = ({ query }: { query: JsonValue }) => {
  const meld = useMeld();
  const [queryResults, setQueryResults] = useState<JsonValue>();

  useEffect(() => {
    if (meld) {
      const doRead = async (state: MeldReadState) =>
        runQuery(state, query).then(setQueryResults);
      meld.read(doRead, (_update, state) => doRead(state));
    }
  }, [meld, query]);

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/css/pretty-print-json.css"
        />
      </Head>
      <pre
        dangerouslySetInnerHTML={{
          __html: prettyPrintJson.toHtml(queryResults),
        }}
      />
    </>
  );
};

// TODO: Stop momentary double-display.
const Turtle = ({ prefixes }: { prefixes?: N3.WriterOptions["prefixes"] }) => {
  const meld = useMeld();
  const [stream, setStream] = useState<Stream<Quad>>();
  const [turtle, setTurtle] = useState("");

  useEffect(() => {
    setTurtle("");

    if (stream) {
      const streamWriter = new N3.StreamWriter({ prefixes });
      streamWriter.on("data", (data: string) => {
        setTurtle((prevTurtle) => prevTurtle + data);
      });

      streamWriter.import(stream);

      return () => {
        streamWriter.destroy();
      };
    }
  }, [prefixes, stream]);

  useEffect(() => {
    if (meld) {
      const streamQuads = (state: MeldReadState) => {
        setStream(state.match());
      };

      const subscription = meld.read(streamQuads, (_update, state) => {
        streamQuads(state);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [meld]);

  return <pre>{turtle}</pre>;
};
