import Head from "next/head";
import { BlogPost } from "../components/BlogPost";
import { NameEditor } from "../components/NameEditor";
import { MeldDebug } from "../components/MeldDebug";

export default function Home() {
  return (
    <>
      <Head>
        <title>Thoughts on RDF – Ever heard of this?</title>
      </Head>
      <BlogPost resource="http://example.com/~santic/blog/ever-heard-of-this" />
      <NameEditor resource="http://example.com/~santic/#me" />
      <MeldDebug />
    </>
  );
}
