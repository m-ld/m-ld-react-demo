import Head from "next/head";
import { useEffect, useState } from "react";
import { clone, MeldClone, uuid } from "@m-ld/m-ld";
import { MemoryLevel } from "memory-level";
import { NullRemotes } from "@/NullRemotes";
import { MeldProvider } from "../hooks/useMeld";
import { BlogPost } from "../components/BlogPost";
import { NameEditor } from "../components/NameEditor";
import { MeldDebug } from "../components/MeldDebug";

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

export default function Home() {
  const [meld, setMeld] = useState<MeldClone>();

  useEffect(() => {
    const promise = clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "test.example.org",
      genesis: true,
      logLevel: "INFO",
    }).then(async (newMeld) => {
      await newMeld.write(blogPostingData);
      setMeld(newMeld);
      return newMeld;
    });

    return () => {
      // It's vital that we wait for the write we may already have scheduled to
      // complete. Otherwise, the write may fail due to the clone closing behind
      // its back. This may represent a bug in m-ld.
      //
      // To reproduce, replace writtenPromise below with clonePromise.
      promise.then((newMeld) => {
        newMeld.close();
      });
    };
  }, []);

  return (
    <>
      <Head>
        <title>Thoughts on RDF – Ever heard of this?</title>
      </Head>
      <MeldProvider value={meld}>
        <BlogPost resource="http://example.com/~santic/blog/ever-heard-of-this" />
        <NameEditor resource="http://example.com/~santic/#me" />
        <MeldDebug />
      </MeldProvider>
    </>
  );
}
