import { useEffect, useState } from "react";
import { Quad, Stream } from "@rdfjs/types";
import { MeldReadState } from "@m-ld/m-ld";
import N3 from "n3";
import { useMeld } from "../hooks/useMeld";

// TODO: Stop momentary double-display.
export const MeldDebug = ({
  prefixes,
}: {
  prefixes?: N3.WriterOptions["prefixes"];
}) => {
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
    }
  }, [meld]);

  return <pre>{turtle}</pre>;
};
