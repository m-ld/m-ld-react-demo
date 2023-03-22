import type { AppProps } from "next/app";
import Head from "next/head";
import { MeldProvider } from "../hooks/useMeld";
import { useEffect, useState } from "react";
import { clone, MeldClone, Subject, uuid } from "@m-ld/m-ld";
import { MemoryLevel } from "memory-level";
import { compact } from "jsonld";
import { NullRemotes } from "@/NullRemotes";

import "todomvc-common/base.css";
import "todomvc-app-css/index.css";
import { MeldDebug } from "@/components/MeldDebug";

// Bit of rigamarole to deal with m-ld's JSON-LD context support not being
// perfect right now.
const isAVTodo = {
  "@type": "Vtodo",
};

const initialDataPromise = compact(
  {
    "@context": {
      "@vocab": "https://todomvc.com/vocab/",
      icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
      items: {
        "@container": "@list",
      },
      "icaltzd:Vtodo": {
        "@context": {
          "@vocab": "http://www.w3.org/2002/12/cal/icaltzd#",
        },
      },
    },
    "@id": "todoMVCList",
    "@type": "TodoList",
    items: [
      {
        "@type": "icaltzd:Vtodo",
        status: "COMPLETED",
        summary: "Taste JavaScript",
        uid: "DB2CCFFD-1B37-4CA4-81B9-D724DFB70BA8",
      },
      {
        "@type": "icaltzd:Vtodo",
        status: "IN-PROCESS",
        summary: "Buy Unicorn",
        uid: "401BFC3D-7C9B-46CC-A842-6D7C91BFD7EC",
      },
    ],
  },
  {}
  // TODO: Use jsonld.js's types in json-rql rather than have it reimplement
  // things all over the place. In particular, `@context` should be allowed to
  // be `null`: https://www.w3.org/TR/json-ld11/#context-propagation
) as Promise<Subject>;

export default function App({ Component, pageProps }: AppProps) {
  const [meld, setMeld] = useState<MeldClone>();

  useEffect(() => {
    const clonePromise = clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "m-ld-react.todomvc.com",
      genesis: true,
      logLevel: "INFO",
    });

    const writtenPromise = clonePromise.then(async (newMeld) => {
      console.log(await initialDataPromise);
      await newMeld.write(await initialDataPromise);
      return newMeld;
    });

    writtenPromise.then((newMeld) => {
      setMeld(newMeld);
    });

    return () => {
      // It's vital that we wait for the write we may already have scheduled to
      // complete. Otherwise, the write may fail due to the clone closing behind
      // its back. This may represent a bug in m-ld.
      //
      // To reproduce, replace writtenPromise below with clonePromise.
      writtenPromise.then((newMeld) => {
        newMeld.close();
      });
    };
  }, []);
  return (
    <MeldProvider value={meld}>
      <Head>
        <title>React / m-ld • TodoMVC</title>
      </Head>

      <section className="todoapp">
        <Component {...pageProps} />
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>
          Created by <a href="http://github.com/Peeja/">Petra Jaros</a>
        </p>
        <p>
          Part of <a href="http://todomvc.com">TodoMVC</a>
        </p>
      </footer>
      <MeldDebug
        prefixes={{
          "m-ld": "http://m-ld.org/",
          todomvc: "https://todomvc.com/vocab/",
          icaltzd: "http://www.w3.org/2002/12/cal/icaltzd#",
          _: "http://m-ld-react.todomvc.com/.well-known/genid/",
          "": "http://m-ld-react.todomvc.com/",
        }}
      />
    </MeldProvider>
  );
}
