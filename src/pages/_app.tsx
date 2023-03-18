import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { MeldProvider } from "../hooks/useMeld";
import { useEffect, useState } from "react";
import { clone, MeldClone, uuid } from "@m-ld/m-ld";
import { MemoryLevel } from "memory-level";
import { NullRemotes } from "@/NullRemotes";

const blogPostingData = {
  "@context": {
    foaf: "http://xmlns.com/foaf/0.1/",
    dc: "http://purl.org/dc/terms/",
    schema: "http://schema.org/",
  },
  "@graph": [
    {
      "@id": "http://example.com/~santic/blog/ever-heard-of-this",
      "@type": "schema:BlogPosting",
      "dc:creator": {
        "@id": "http://example.com/~santic/#me",
        "foaf:name": "Samantha Antic",
      },
      "dc:title": "Ever heard of this?",
      "schema:text":
        '\n        I just heard about this new thing called "Web Zero". Seems pretty neat!\n        We\'ll have to see how it shapes up, though.\n      ',
    },
  ],
};

export default function App({ Component, pageProps }: AppProps) {
  const [meld, setMeld] = useState<MeldClone>();

  useEffect(() => {
    const clonePromise = clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "test.example.org",
      genesis: true,
      logLevel: "INFO",
    });

    const writtenPromise = clonePromise.then(async (newMeld) => {
      await newMeld.write(blogPostingData);
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
      <Component {...pageProps} />
    </MeldProvider>
  );
}
