import { useEffect, useState } from "react";
import { Quad, Stream } from "@rdfjs/types";
import { MeldReadState } from "@m-ld/m-ld";
import N3 from "n3";
import { useMeld } from "../hooks/useMeld";

const StreamedStringDisplay = ({
  prefixes,
  stream,
  streamId,
}: {
  prefixes?: N3.WriterOptions["prefixes"];
  stream: Stream<Quad>;
  streamId: number | undefined;
}) => {
  const [totalString, setTotalString] = useState("");

  useEffect(() => {
    // if (!stream) return;
    const streamWriter = new N3.StreamWriter({ prefixes });
    streamWriter.on("data", (data: string) => {
      console.log(streamId, data);
      setTotalString((prevTotalString) => prevTotalString + data);
    });

    // console.log(stream);

    streamWriter.import(stream);

    return () => {
      // console.log("destroying");
      // setTotalString("");
      streamWriter.destroy();
    };
  }, [prefixes, stream]);

  return <pre>{totalString}</pre>;
};

// TODO: Stop momentary double-display.
export const MeldDebug = ({
  prefixes,
}: {
  prefixes?: N3.WriterOptions["prefixes"];
}) => {
  const meld = useMeld();
  const [stream, setStream] = useState<Stream<Quad>>();
  const [streamId, setStreamId] = useState<number>();

  useEffect(() => {
    if (!meld) return;

    const streamQuads = (state: MeldReadState) => {
      setStream(state.match());
      setStreamId(Math.random);
    };

    const subscription = meld.read(
      async (state) => {
        streamQuads(state);
      },
      async (update, state) => {
        streamQuads(state);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [meld]);

  return (
    stream && (
      <StreamedStringDisplay
        prefixes={prefixes}
        stream={stream}
        streamId={streamId}
        key={streamId}
      />
    )
  );
};
