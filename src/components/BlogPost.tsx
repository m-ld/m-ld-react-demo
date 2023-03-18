import { useSubject } from "../hooks/useSubject";

export const BlogPost = ({ resource }: { resource: string }) => {
  const blogPost = useMeldData(BlogPostingShape, resource);

  if (!blogPost) return <>Loading...</>;

  const {
    "http://purl.org/dc/terms/title": title,
    "http://purl.org/dc/terms/creator": creator,
    "http://schema.org/text": text,
  } = blogPost;

  // const { "http://xmlns.com/foaf/0.1/name": creatorName } =
  //   useSubject(creator?.["@id"]) ?? {};

  return (
    <article>
      <h1>{typeof title == "string" && title}</h1>
      <div className="byline">
        by{" "}
        <span className="author-name">
          {typeof creatorName == "string" && creatorName}
        </span>
      </div>

      <div className="article-body">{typeof text == "string" && text}</div>

      <div className="bio">
        <span className="author-name">
          {typeof creatorName == "string" && creatorName}
        </span>{" "}
        is a technologist who spends a little too much time thinking about RDF.
      </div>
    </article>
  );
};
