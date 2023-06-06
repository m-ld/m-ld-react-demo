<!-- markdownlint-disable no-space-in-code -->

TK:

- Expressiveness: Can express all the things you'd want to, without too much fuss.
- Readability: Can be understood by readers.
- Error-resilience (?): Unlikely to make mistakes

# Analysis

Goal: to encourage and support the development of Healthy Web Apps, defined by:

- No lock-in
- No attention theft
- Retention of control over personal data

So, why do people keep building apps which lock users in and keep control over
their users' personal data? We see two reasons.

First: there is an economic incentive to developing unhealthy apps. Data is
valuable, and companies who produce applications would prefer to have access to
as much of it as possible. Active users are valuable, as they produce valuable
data, and are also available to target with another revenue source, advertising.
Thus, the more an application developer can keep users and their data tied to a
platform, the more that application will succeed economically—that is, until and
unless the users demand an alternative. However, it's hard for users to make
much progress simply asking for change; the most effective way for users to make
their needs known is to actually leave the services they disagree with in favor
of those which treat them better, and to do that, there must be alternatives
available to move _to_.

Thus the second reason: there is a technological disincentive to developing
healthy apps. It's simply much easier to develop an application in which
everyone's data is centralized in a database under the application developer's
control. Exposing that data via some sort of API is a good deal of extra effort
that can be hard to justify. Interchanging data with other applications, to the
point of eliminating lock-in, is even harder to justify, as it both gives users
a route to leave the application _and_ is even harder to build than simply
exposing the data in some ad-hoc format.

We know there are people interested in developing healthy apps because they
currently do so, even in the face of technological difficulty. The entire Solid
project is evidence of this. We have a great deal of respect for Solid and its
approach, and draw inspiration from it. However, we believe it doesn't provide
enough to make a range of modern applications easy to build well: in particular,
apps with real-time multi-user collaboration.

We therefore propose a set of tools which make real-time multi-user
collaboration significantly easier to implement without lock-in or forcing users
to cede control of their personal data.

We will build these tools on top of m-ld's "domains", a CRDT for replicating
Linked Data graphs in realtime. By replicating the data locally among
collaborating participants, we preserve the users' ownership of their own data.
By using Linked Data as the basis for the data model, we ensure that application
data is readable at some level by any other Linked Data tool. For instance, the
data can easily be moved between a m-ld domain and a Solid pod if desired, where
it can be used by other applications. For hosted persistence, we offer the m-ld
Gateway, a server which (among other functions) operates as another participant
in the domain, and thus keeps its own copy of the data, analogous to an IPFS
pinning service. This Gateway service may be offered by the application
developer for convenience, but it may also be operated by end user themselves if
desired, preserving user control. Just as end users can bring their own pods to
a Solid app, they can also bring their own Gateways to these collaborative apps.

## TK name

To make such an application suitably easy to build well, we believe developers
will need the following capabilities:

### Reactive Observable Queries

Our data store presents a graph of data which can change (through the actions of
other collaborators) at any moment. Therefore, any application will need:

1. To be able to query the graph to get exactly the data they need, and
2. To get updates to that data as soon as they become available, in a form that
   makes them easy to present to the user.

Therefore, we will build a query language for this data store which can address
any data required, and a reactive interface to use that query language which
presents an [RxJS Observable](https://rxjs.dev/guide/observable) of successive
query results. This interface is convenient to use in any web framework or
library, including React, Angular, and the Web Components ecosystem.

For the purposes of this document, we name this query language "xQL", where "x"
is meant to be a placeholder. It is expected that this language will merge with
[json-rql](https://json-rql.org/) eventually, but for now it will be considered
as its own specification with its own (temporary) name.

The language is specified below with some precision. Bear in mind, however, that
this is a draft for analysis purposes and subject to change during
implementation.

Goals:

- Readability
- Composability
- Type safety

Inspiration:

- GraphQL
- SPARQL
- Datomic Pull
- JSON-LD and JSON-LD Framing

Things that are true:

- An xQL query is a "JSON object" (that is, an object which can be validly
  represented as JSON), and more specifically a valid JSON-LD document. However,
  it is not itself terribly useful as a source of data. This is akin to JSON-LD
  frames, which are valid JSON-LD documents, but are most useful used as frames,
  not as sources of data.

- Objects within an xQL query may contain several keys which begin with `@`
  which are keywords not defined by JSON-LD but defined by xQL ("xQL keywords").
  These keys and their values are ignored by JSON-LD processors.

- An xQL query is applied to a JSON-LD-compatible data source, such as a JSON-LD
  document or any RDF graph or dataset.

- The _result_ of a query is always a valid JSON-LD document. When interpreted
  as a JSON-LD document by a JSON-LD processor, the document describes a set of
  facts (triples) which is a subset of the facts in the original, queried data
  source.

- The result of a query always has the same structure as the query itself. More
  specifically:

  - An object in the query corresponds to an object in the result with the same
    keys.

  - An array in the query corresponds to [TK]

- TK more

#### Notable differences from related languages

GraphQL:

- ✅ Recursive, composable query structure
- ✅ Results which match the structure of the query
- ❌ GraphQL has a novel string representation; xQL is a subset of JSON, and
  generally represented as object literals rather than a string.
- ❌ GraphQL schemas begin with a root `Query` node where are queries begin; xQL
  queries match over the entire set of data.

#### Examples

For our examples, we'll use the data offered by [SWAPI](https://swapi.dev/), the
Star Wars API. This API offers a rich set of data in a JSON format which is
easily read as JSON-LD by attaching a context to each resource.

The context:

```json
{
  "@context": {
    "@vocab": "http://swapi.dev/documentation#",
    "url": "@id",
    "height": { "@type": "xsd:integer" },
    "mass": { "@type": "xsd:integer" },
    "vehicles": { "@type": "@id" }
    // TK more here?
  }
}
```

Additionally, we add an additional `@type` key to each resource naming its type,
as this is not present in SWAPI's responses and [not possible to add with a
`@context`](https://github.com/w3c/json-ld-syntax/issues/386). The values for
`@type` are `Planet`, `Spaceship`, `Vehicle`, `Person`, `Film`, and `Species`.

##### Match by `@id`: What color is Luke's hair?

Suppose we have the IRI for [Luke Skywalker](https://swapi.dev/api/people/1/). Then we might ask:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "@id": "https://swapi.dev/api/people/1/",
  "hair_color": "?"
}
```

Note the placeholder at `hair_color`. The query engine will attempt to find a
value for this key. We will get the result:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "@id": "https://swapi.dev/api/people/1/",
  "hair_color": "blond"
}
```

##### Match by `name`: What color are Luke's eyes?

Suppose we _don't_ know Luke's IRI yet. Then we might ask:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "name": "Luke Skywalker",
  "eye_color": "?"
}
```

Then we expect to get the following:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "name": "Luke Skywalker",
  "eye_color": "blue"
}
```

Notice that the result, once again, has the same shape as the query. The query
serves as a template which the query engine "fills in".

##### Graph traversal: What vehicles has Luke piloted?

What if we want know about related entities, such as the vehicles Luke has piloted?

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "name": "Luke Skywalker",
  "vehicles": [
    {
      "name": "?",
      "model": "?",
      "manufacturer": "?"
    }
  ]
}
```

The result:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "name": "Luke Skywalker",
  "vehicles": [
    {
      "name": "Snowspeeder",
      "model": "t-47 airspeeder",
      "manufacturer": "Incom corporation"
    },
    {
      "name": "Imperial Speeder Bike",
      "model": "74-Z speeder bike",
      "manufacturer": "Aratech Repulsor Company"
    }
  ]
}
```

Notice that `vehicles` was an array in the query, and remains an array in the
result. By JSON-LD semantics, an array of a single value is equivalent to the
single value, not in an array. However, in xQL, the result value will always be
in an array exactly when it was in an array in the query, regardless of the
cardinality. A property value not in an array in the query is implicitly limited
to 1 result, which may choose an arbitrary value, so this is intended for cases
where the query expects a single value to exist in the data.

##### Filtering with operators

Suppose we want to find all of the Skywalkers—that is, all people whose name
ends in ` Skywalker`:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "@graph": [
    {
      "@id": "?",
      "@type": "Person",
      "name": { "@value": "?", "@strends": " Skywalker" }
    }
  ]
}
```

`@strends` here corresponds to [the SPARQL function
`STRENDS`](https://www.w3.org/TR/sparql11-query/#func-strends). This query will
give us:

```json
{
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "@graph": [
    {
      "@id": "https://swapi.dev/api/people/1/",
      "@type": "Person",
      "name": { "@value": "Luke Skywalker", "@strends": " Skywalker" }
    },
    {
      "@id": "https://swapi.dev/api/people/11/",
      "@type": "Person",
      "name": { "@value": "Anakin Skywalker", "@strends": " Skywalker" }
    },
    {
      "@id": "https://swapi.dev/api/people/43/",
      "@type": "Person",
      "name": { "@value": "Shmi Skywalker", "@strends": " Skywalker" }
    }
  ]
}
```

#### Reactive Updates

With pure RxJS observables:

```ts
const result$ = observeQuery({
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  "@graph": [
    {
      "@id": "?",
      "@type": "Person",
      hair_color: "?",
      name: { "@value": "?", "@strends": " Skywalker" },
    },
  ],
});

result$.subscribe((result) => {
  console.log("Got result:", result);
});

// Console: Got result: {
//   "@context": { "@vocab": "http://swapi.dev/documentation#" },
//   "@graph": [
//     {
//       "@id": "https://swapi.dev/api/people/1/",
//       "@type": "Person",
//       "hair_color": "blond",
//       "name": { "@value": "Luke Skywalker", "@strends": " Skywalker" }
//     },
//     {
//       "@id": "https://swapi.dev/api/people/11/",
//       "@type": "Person",
//       "hair_color": "blond",
//       "name": { "@value": "Anakin Skywalker", "@strends": " Skywalker" }
//     },
//     {
//       "@id": "https://swapi.dev/api/people/43/",
//       "@type": "Person",
//       "hair_color": "black",
//       "name": { "@value": "Shmi Skywalker", "@strends": " Skywalker" }
//     }
//   ]
// }

// Either locally or remotely, the `hair_color` of
// `https://swapi.dev/api/people/1/` is changed to "ash-brown".

// Console: Got result: {
//   "@context": { "@vocab": "http://swapi.dev/documentation#" },
//   "@graph": [
//     {
//       "@id": "https://swapi.dev/api/people/1/",
//       "@type": "Person",
//       "hair_color": "ash-brown",
//       "name": { "@value": "Luke Skywalker", "@strends": " Skywalker" }
//     },
//     {
//       "@id": "https://swapi.dev/api/people/11/",
//       "@type": "Person",
//       "hair_color": "blond",
//       "name": { "@value": "Anakin Skywalker", "@strends": " Skywalker" }
//     },
//     {
//       "@id": "https://swapi.dev/api/people/43/",
//       "@type": "Person",
//       "hair_color": "black",
//       "name": { "@value": "Shmi Skywalker", "@strends": " Skywalker" }
//     }
//   ]
// }

// Either locally or remotely, the name of `https://swapi.dev/api/people/11/`
// is changed to "Darth Vader".

// Console: Got result: {
//   "@context": { "@vocab": "http://swapi.dev/documentation#" },
//   "@graph": [
//     {
//       "@id": "https://swapi.dev/api/people/1/",
//       "@type": "Person",
//       "hair_color": "ash-brown",
//       "name": { "@value": "Luke Skywalker", "@strends": " Skywalker" }
//     },
//     {
//       "@id": "https://swapi.dev/api/people/43/",
//       "@type": "Person",
//       "hair_color": "black",
//       "name": { "@value": "Shmi Skywalker", "@strends": " Skywalker" }
//     }
//   ]
// }
```

Note that `observeQuery()` as proposed here must already have some awareness of
the data store (the m-ld clone) it reads from. It could be constructed by the
application in terms of the clone (`const observeQuery =
queryObserverFor(clone)`), or it could be provided by the library and take the
clone as another argument (`observeQuery(clone, query)`). The exact API is still
to be determined based on what turns out to be most convenient.

In React:

```tsx
const Skywalkers = () => {
  const skywalkers = useQuery({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@graph": [
      {
        "@id": "?",
        "@type": "Person",
        hair_color: "?",
        name: { "@value": "?", "@strends": " Skywalker" },
      },
    ],
  });

  return (
    <ul>
      {skywalkers.map((person) => (
        <li key={person["@id"]}>
          <a href={person["@id"]}>{person.name["@value"]}</a> has{" "}
          {person.hair_color} hair.
        </li>
      ))}
    </ul>
  );
};
```

In React, the `useQuery` hook is little more than a wrapper around
`observeQuery`. It simply returns each result emitted from the observable,
causing the component to re-render with new data. If we'd prefer the list items
to be their own component, we have a few choices. First, we can declare `Person`
to take `name` and `hair_color`, which ensures that `Skywalkers` fetches those
values and passes them along:

```tsx
const Person = ({
  id,
  name,
  hairColor,
}: {
  id: string;
  name: string;
  hairColor: string;
}) => (
  <li>
    <a href={id}>{name}</a> has {hairColor} hair.
  </li>
);

///

const Skywalkers = () => {
  const skywalkers = useQuery({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@graph": [
      // This component is responsible for getting the bits we'll need to pass
      // to `Person`.
      {
        "@id": "?",
        "@type": "Person",
        hair_color: "?",
        name: { "@value": "?", "@strends": " Skywalker" },
      },
    ],
  });

  return (
    <ul>
      {skywalkers.map((person) => (
        <Person
          key={person["@id"]}
          id={person["@id"]}
          name={person.name["@value"]}
          hairColor={person.hair_color}
        />
      ))}
    </ul>
  );
};
```

<!--

TK: This is funky, because the parent should own filtering while the child owns projection.

Second, we can have `Person` expose the query that it needs and have the parent
component roll that up:

```tsx
const PERSON_QUERY = {
  "@id": "?",
  "@type": "Person",
  hair_color: "?",
  name: { "@value": "?", "@strends": " Skywalker" },
};

const Person = ({ person }: { person: QueryResult<typeof PERSON_QUERY> }) => (
  <li>
    <a href={person["@id"]}>{person.name["@value"]}</a> has {person.hair_color}{" "}
    hair.
  </li>
);

Person.query = PERSON_QUERY;

///

const Skywalkers = () => {
  const skywalkers = useQuery({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@graph": [
      // We'll get whatever `Person` says it wants.
      Person.query,
    ],
  });

  return (
    <ul>
      {skywalkers.map((person) => (
        <Person key={person["@id"]} person={person} />
      ))}
    </ul>
  );
};
``` -->

Lastly, the child components can make and subscribe to their own queries
entirely:

```tsx
const Person = ({ id }: { id: string }) => {
  // Given an `id`, `Person` can query for its own data.
  const person = useQuery({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": id,
    "@type": "Person",
    hair_color: "?",
    name: { "@value": "?", "@strends": " Skywalker" },
  });

  return (
    <li>
      <a href={person["@id"]}>{person.name["@value"]}</a> has{" "}
      {person.hair_color} hair.
    </li>
  );
};

///

const Skywalkers = () => {
  const skywalkers = useQuery({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@graph": [
      // We only need the `@id` to pass to the child component.
      {
        "@id": "?",
        name: { "@value": "?", "@strends": " Skywalker" },
      },
    ],
  });

  return (
    <ul>
      {skywalkers.map((person) => (
        <Person key={person["@id"]} id={person["@id"]} />
      ))}
    </ul>
  );
};
```

Notably, in this version, `Skywalkers` is not observing as many facts. When
Luke's hair turns ash-brown now, `Skywalkers` will not re-render, but Luke's
`Person` component will. But when Anakin changes his name to "Darth Vader",
`Skywalkers` _will_ re-render, and drop one of the elements from the list it displays.

### Writing Data

It is, of course, already possible to write data to a m-ld clone, and any
existing write APIs will trigger any observed queries as expected. However, the
API can be a bit clunky for UI-driven code.

```ts
const updateName = () => {
  meld.write({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    // Must use `@delete` and `@insert` at the top level.
    "@delete": {
      "@id": "https://swapi.dev/api/people/11/",
      // Must explicitly delete any existing values of the `name`.
      name: "?",
    },
    "@insert": {
      "@id": "https://swapi.dev/api/people/11/",
      name: "Darth Vader",
    },
  });
};
```

Instead, we will introduce a newer write syntax which parallels the reading
queries above:

```ts
const updateName = () => {
  meld.write({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    // Just like read queries, uses literal values for pattern-matching.
    "@id": "https://swapi.dev/api/people/11/",
    // Neatly replaces existing values with a new value with a single operator.
    name: { "@update": "Darth Vader" },
  });
};
```

These writes can describe more specific intentions, which allow them to handle
concurrency better:

```ts
const duelWithVader = () => {
  meld.write({
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": "https://swapi.dev/api/people/1/",
    mass: { "@minus": 1 },
  });
};
```

Whatever the value of Luke's `mass` is when this write reaches the domain, this
will reduce it by 1.

### TypeScript Support

The structure and syntax defined here has been selected for its utility for the
app developer. We can greatly ease the developer experience by offering strong,
useful types, in two ways:

1. In reads and writes themselves, we can offer types which make constructing
   the queries (and indeed _any_ JSON-LD document) more ergonomic in supportive editors.
2. In query _results_, we can offer sophisticated types based on the query
   itself, making the results object more ergonomic to work with and making it
   harder to introduce errors as the application changes over time.

#### Useful types for JSON-LD documents

JSON-LD itself is not aware of the expected types of properties. However,
JSON-LD contexts do map properties from one name to another—thus, given the
expected types of various properties by their IRIs, a sophisticated system of
TypeScript types can map those types to their new names under a given JSON-LD
context.

The exact mechanics and API of this will be developed further during this
milestone, but so far we have built enough to confirm that this possible to
accomplish in TypeScript. The examples here demonstrate what is built so far.

Because of the current limitations of TypeScript's contextual typing inference,
we can only do this checking on an argument to a function call. In many cases,
this is just fine: if the document in question is a query, it will typically
appear as an argument to `observeQuery()` or `useQuery()`. For other cases, we
can provide an identity function which lets TypeScript apply the types properly
without actually doing anything at runtime. The examples below use such a
function, which we call here `jsonld()`.

First, we must define some property types. This can be in an interface which is
explicitly provided to the query mechanism, or it can be a global interface
which can be extended through declaration merging from anywhere in the
application. (This is reasonable in most cases, as the keys are IRIs, and
typically will only need a single type definition within a given application.)
The interface looks something like this:

```ts
interface PropertyTypes {
  "http://swapi.dev/documentation#name": string;
  "http://swapi.dev/documentation#height": number;
  "http://swapi.dev/documentation#mass": number;
}
```

That is, in this application, we expect that in any JSON-LD document, a
`"http://swapi.dev/documentation#height"` key maps to a `number`, and so on.
Now, if `jsonld()` is built with this `PropertyTypes` interface, we can expect:

```ts
// ✅ This has no problem:
jsonld({ "http://swapi.dev/documentation#height": 172 });

// ❌ But this is an error:
jsonld({ "http://swapi.dev/documentation#height": "Luke Skywalker" });
```

So far, this is not terribly interesting. But once contexts come into play, it's
much more interesting:

```ts
jsonld({
  "@context": {
    height: "http://swapi.dev/documentation#height",
  } as const,
  // ✅ This has no problem:
  height: 172,
});

jsonld({
  "@context": {
    height: "http://swapi.dev/documentation#height",
  } as const,
  // ❌ But this is an error:
  height: "Luke Skywalker",
});
```

That is, the JSON-LD context now allows TypeScript to correctly type _term_
keys, key names defined in the context, by mapping them to their IRIs.

(Note that the `@context` must currently be declared `as const` to prevent
TypeScript from throwing away necessary information. TypeScript 5.0 offers [a
feature which should make this
unnecessary](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#const-type-parameters),
but due to a bug, that feature [doesn't work yet with the complex types we
need](https://github.com/microsoft/TypeScript/issues/54537).)

This mapping not only provides type _checking_; it also enables _completions_ in
the editor, greatly improving ergonomics. For instance, suppose an editor
contains the following code:

```ts
jsonld({
  "@context": {
    /** The name of the entity. */
    name: "http://swapi.dev/documentation#name",
    /** A person's height. */
    height: "http://swapi.dev/documentation#height",
  } as const,
  // <- Cursor here
});
```

Bringing up the editor's completion feature (`Ctrl-Space` by default in VS Code)
will display the options `name` and `height` for completion—and even better,
will display the docstrings given for each of them. (It would be preferable to
display a docstring defined within `PropertyTypes`, but unfortunately [this is
not currently possible in
TypeScript](https://github.com/microsoft/TypeScript/issues/50715). If this issue
is resolved, however, we will be able to add that ability.) possible.]

JSON-LD contexts propagate to child nodes, and these types propagate in the same
way. Thus:

```ts
jsonld({
  "@context": {
    name: "http://swapi.dev/documentation#name",
    parent: "https://schema.org/parent",
  } as const,

  name: "Luke Skywalker",
  // ❌ This is an error, because `height` isn't in context here.
  height: 172,

  // `parent` is in the context, and typed as `unknown` (not in `PropertyTypes)
  parent: {
    "@context": {
      // The term `height` is only defined under this node.
      height: "http://swapi.dev/documentation#height",
    } as const,
    // ✅ This isn't an error, because `name` is still in context here.
    name: "Anakin Skywalker",
    // ✅ This isn't an error, because `height` is now in context.
    height: 188,
  },
});
```

JSON-LD contexts are defined with a great deal of complexity. We intend to
implement typing for the majority of that complexity, including [Default
Vocabulary](https://www.w3.org/TR/json-ld11/#default-vocabulary), [Compact
IRIs](https://www.w3.org/TR/json-ld11/#compact-iris) and [Scoped
Contexts](https://www.w3.org/TR/json-ld11/#scoped-contexts). We may leave less
common features for future work, such as [Imported
Contexts](https://www.w3.org/TR/json-ld11/#imported-contexts) and [Protected
Term Definitions](https://www.w3.org/TR/json-ld11/#protected-term-definitions).

Most notably, type-scoped contexts will yield a more schema-like definition, as
each `@type` can define its own set of properties.

#### Query results

Once the application has query results, it has to do something with them.
Teasing apart the results object is error-prone without the support of type
checking and the editor ergonomics it affords.

```tsx
const data = useQuery({
  "@context": { "@vocab": "http://swapi.dev/documentation#" },
  name: "Luke Skywalker",
  height: "?",
  vehicles: [
    {
      name: "?",
      model: "?",
      manufacturer: "?",
    },
  ],
} as const);

return (
  <div>
    {data.name} ({data.height / 100}m) has piloted{" "}
    {data.vehicles.map((v) => v.name).join(", ")}
  </div>
);
```

There's a strong coupling here between the structure of the query and the access
into the `data` object below. Without a well-typed `data` object, this code can
easily break in the face of a typo, and if either the query or the access
changes in the future, only human vigilence or testing will catch if they drift
apart. The problem is even worse if we, say, pass the vehicles to another
component to render, as we then have two, possibly distant components to keep in
sync.

In the GraphQL community, this is typically solved with types, but as TypeScript
doesn't understand GraphQL natively, this either requires manually typing `data`
and ensuring that type stays up to date as code changes, or running a separate
toolchain to automatically build type definitions from the queries and schema.

In xQL, we have the advantage of both the queries and the "schema" being native
to TypeScript: the query is an object, and the equivalent of a schema is defined
by the `PropertyTypes` interface. Since the result by definition has the same
structure as the query itself, and since we can already type the query, we can
also translate the query into a type for the result data. Thus, in the query
above, TypeScript derives the type for `data` as:

```ts
const data: {
  "@context": {
    "@vocab": "http://swapi.dev/documentation#";
  };
  name: "Luke Skywalker";
  height: number;
  vehicles: {
    name: string;
    model: string;
    manufacturer: string;
  }[];
};
```

As of this analysis, the implementation in progress of query result types are
quite bare-bones: they very simply map the structure of the query to a result
object type, taking query placeholders into account, and do no term resolution
using the context. Having established in the JSON-LD document types described
above that we can do that term resolution, we are confident we can reuse it for
result typing.
