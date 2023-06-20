_Disclaimer: The following represents some thinking I've done lately about multi-graph support in JSON-LD in anticipation of some ideas for [m-ld](https://m-ld.io) and [Web Zero](https://nlnet.nl/project/WebZero/). The use case is not inspired by an immediate concrete need, and therefore should be taken with some skepticism. I'm posting it here mainly to see if it aligns with ideas others are having, and for reference if/when the needs I'm thinking of become more concrete. If having this issue open is unproductive, feel free to close._

---

The `@graph` mechanism is currently optimized syntactically for graphs which describe disjoint sets of subjects. It's also nicely suited for graphs which themselves are also objects of properties (or, technically, share a name with objects of properties). It's not currently well suited for multiple graphs making statements about the same subject (unless I'm missing a different way to use `@graph`). Consider the following data:

```turtle
<ex:jane> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<ex:jane> <http://schema.org/name> "Jane Doe" .
<ex:jane> <http://schema.org/jobTitle> "Professor" .
<ex:jane> <http://schema.org/url> <http://www.janedoe.com> .

<ex:jane> <http://schema.org/telephone> "(425) 123-4567" <ex:campusDirectory> .
<ex:jane> <http://schema.org/email> "jane@uni.edu" <ex:addressBook> .
```

This represents three graphs each describing various facts about Prof. Jane Doe: the default graph describing her personhood, name, title, and URL, the campus directory listing her phone number, and an address book listing her email address. In JSON-LD 1.1, I believe this is the most compact way to represent this data:

```json
{
  "@context": "http://schema.org/",
  "@graph": [
    {
      "@id": "ex:jane",
      "type": "Person",
      "jobTitle": "Professor",
      "name": "Jane Doe",
      "url": "http://www.janedoe.com"
    },
    {
      "@id": "ex:addressBook",
      "@graph": [
        {
          "@id": "ex:jane",
          "email": "jane@uni.edu"
        }
      ]
    },
    {
      "@id": "ex:campusDirectory",
      "@graph": [
        {
          "@id": "ex:jane",
          "telephone": "(425) 123-4567"
        }
      ]
    }
  ]
}
```

Even though all of the facts here are about Jane, we have to keep some of the facts quite far away from the others because they belong to different graphs. Again, this approach is perfectly natural when the multiple graphs in a dataset tend to describe disjoint sets of subjects, but awkward when they tend to describe the same set of subjects (even when they use disjoint sets of predicates to describe those subjects).

As [the `@graph` key must currently always map to a node object or array of node objects](https://www.w3.org/TR/json-ld11/#named-graphs), we might use string values of `@graph` to convey this. Whereas the existing use of `@graph` in JSON-LD 1.1 reads as something like "…is a graph which contains…", this use of `@graph` should read as something like "…according to the graph named…".

```json
{
  "@context": "http://schema.org/",

  "@id": "ex:jane",
  "type": "Person",
  "jobTitle": "Professor",
  "name": "Jane Doe",
  "url": "http://www.janedoe.com",

  "telephone": {
    "@graph": "ex:campusDirectory",
    "@value": "(425) 123-4567"
  },

  "email": {
    "@graph": "ex:addressBook",
    "@value": "jane@uni.edu"
  }
}
```

What about when the objects aren't values?

```json
{
  "@context": [
    "http://schema.org/",
    { "teachesCourseInstances": { "@reverse": "instructor" } }
  ],

  "@id": "ex:jane",
  "type": "Person",
  "name": "Jane Doe",

  "spouse": {
    "@graph": "ex:campusDirectory",
    "@id": "ex:john",
    "type": "Person",
    "name": "John Doe",
    "jobTitle": "Professor"
  },

  "teachesCourseInstances": {
    "@graph": "ex:courseCatalog",
    "@set": [
      {
        "type": "CourseInstance",
        "name": "JSON-LD for You and Me",
        "about": "https://www.w3.org/TR/json-ld11/"
      },
      {
        "type": "CourseInstance",
        "name": "Schema.org: A Semantic Smorgasbord",
        "about": "http://schema.org/"
      }
    ]
  }
}
```

Under `spouse`, John has a `@graph` key. If the value of that key were a node object or array of node objects, this would mean that John is also (or shares an identifier with) a named graph containing the data in those objects. In this case, though, it means both:

1. That `<ex:jane> schema:spouse <ex:john>` is a triple in `ex:campusDirectory`, and
2. That `<ex:john> a schema:Person; schema:name "John Doe"; schema:jobTitle "Professor"` are all triples in `ex:campusDirectory` as well.

That is, the `@graph` cascades into deeper nodes in the tree. My assumption here is that this would match up with typical usage and be convenient for an author.

Under `teachesCourseInstances`, we have a `@set` which has a `@graph`. This is exactly equivalent to putting the same `@graph` key in each of the set elements, which again means both that the fact of each element being in the set is in the graph `ex:courseCatalog`, _and_ that the `name` and `about` values given for each of them is also in `ex:courseCatalog`.

A `@graph` with a string at the top level would simply set the name of the graph to cascade into deeper nodes.

---

Secondly, I propose an equivalent method to specify the graph name within the context:

```json
{
  "@context": [
    "http://schema.org/",
    {
      "telephone": { "@graph": "ex:campusDirectory" },
      "email": { "@graph": "ex:addressBook" },
      "spouse": { "@graph": "ex:campusDirectory" },
      "teachesCourseInstances": {
        "@reverse": "instructor",
        "@graph": "ex:courseCatalog"
      }
    }
  ],

  "@id": "ex:jane",
  "type": "Person",
  "jobTitle": "Professor",
  "name": "Jane Doe",
  "url": "http://www.janedoe.com",

  "telephone": "(425) 123-4567",
  "email": "jane@uni.edu",

  "spouse": {
    "@id": "ex:john",
    "type": "Person",
    "jobTitle": "Professor",
    "name": "John Doe",

    "telephone": "(425) 123-9876",
    "email": "john@uni.edu"
  },

  "teachesCourseInstances": [
    {
      "type": "CourseInstance",
      "name": "JSON-LD for You and Me",
      "about": "https://www.w3.org/TR/json-ld11/"
    },
    {
      "type": "CourseInstance",
      "name": "Schema.org: A Semantic Smorgasbord",
      "about": "http://schema.org/"
    }
  ]
}
```

This document is semantically equivalent to the combination of the examples before, with the addition of John's telephone number and email address. Note that these are stated here to be in the `ex:campusDirectory` and `ex:addressBook` graphs respectively, just like Jane's, because the `@graph` is defined for those properties generally, in the context. This is convenient when a particular graph "owns" a particular set of properties—in this case, we expect telephone numbers and email addresses to always live in those respective graphs. If that were true specifically when the subject is a `Person`, we could even type-scope it:

```json
{
  "@context": [
    "http://schema.org/",
    {
      "Person": {
        "telephone": { "@graph": "ex:campusDirectory" },
        "email": { "@graph": "ex:addressBook" },
        "spouse": { "@graph": "ex:campusDirectory" },
        "teachesCourseInstances": {
          "@reverse": "instructor",
          "@graph": "ex:courseCatalog"
        }
      }
    }
  ]
}
```

---

Having written all that out, some caveats:

- Overloading `@graph` this way may be too messy or confusing, even though it's technically unambiguous. It can clash in the case where you want both semantics: If you want the fact that John is Jane's spouse to be in the `ex:campusDirectory` graph _and_ John is himself a graph containing more statements, you'd want to use `@graph` on John's node for both things. We could do exactly what I've proposed above but with a different keyword, though it seems kind of a shame not to use a keyword called `@graph` for this. 😄

- Exactly how the `@context` version works, especially in terms of how it cascades, is poorly specified above. It's possible what I've written paints the idea into a corner that can't be resolved, or can't be made non-confusing.

- As mentioned at the top, this is based on speculative use cases more than real ones at the moment. I intend to return to it if/when the use cases I have in mind become more concrete, but if people reading have concrete use cases in mind, let's consider how well this proposal would apply to them.
