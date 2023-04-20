const q1 = {
  "@id": "?",
  "<property1>": "?",
};

const result1 = [
  {
    "@id": "ex:a",
    "<property1>": [1, 2, 3],
  },
];

const q2 = {
  "@id": "?",
  "<property1>": { "@sum": "?" },
};

const result2 = [
  {
    "@id": "ex:a",
    "<property1>": { "@sum": 6 },
  },
];

const q3 = {
  "@id": "?",
  "<property1>": { "@sum": { "@value": "?", "@gt": 7 } },
};

const result3 = [
  //   {
  //     "@id": "ex:a",
  //     "<property1>": { "@sum": { "@value": 6, "@gt": 3 } },
  //   },
];

const q4 = {
  "@id": "?",
  "<property1>": { "@gt": 2 },
};

const result4 = [
  {
    "@id": "ex:a",
    "<property1>": [{ "@value": 3, "@gt": 2 }],
  },
];

const q5 = {
  "@id": "?",
  "<property1>": { "@sum": 6 },
};

const result5 = [
  {
    "@id": "ex:a",
    // "<property1>": { 0: 1, 1: 2, 2: 3, "@sum": 6 },
    "<property1>": { "@set": [1, 2, 3], "@sum": 6 },
  },
];

const q6 = {
  "@id": "?",
  name: "?",
  "<property1>": {
    name: "foo",
  },
};

const result6 = [
  {
    "@id": "ex:a",
    name: "bar",
    "<property1>": [
      //   {
      //     "@id": "ex:b",
      //     name: "foo",
      //   },
      //   {
      //     "@id": "ex:c",
      //     name: "foo",
      //   },
    ],
  },
];

// Can I identify the issue I had in my mind last night?

/**
 * Tell me:
 * - Luke's name
 * - The number of vehicles Luke has piloted
 * - Each of those vehicles' names
 * - The total of their crew complements
 * - The number of his films directed by George Lucas
 * - Each of those films' names
 */

const q7 = {
  url: "https://swapi.dev/api/people/1/",
  name: "?",
  vehicles: {
    "@set": {
      url: "?",
      name: "?",
      crew: "?",
    },
    "@count": "?",
    "@aggregate": {
      crew: { "@sum": "?" },
    },
  },
  lucasFilms: {
    "@property": "films",
    "@set": {
      director: "George Lucas",
      name: "?",
    },
    "@count": "?",
  },
};

const result7 = {
  url: "https://swapi.dev/api/people/1/",
  name: "Luke Skywalker",
  vehicles: {
    "@set": [
      {
        url: "https://swapi.dev/api/vehicles/14/",
        name: "Snowspeeder",
        crew: "2",
      },
      {
        url: "https://swapi.dev/api/vehicles/30/",
        name: "Imperial Speeder Bike",
        crew: "1",
      },
    ],
    "@count": "2",
    "@aggregate": {
      crew: { "@sum": "3" },
    },
  },
  lucasFilms: {
    "@property": "films",
    "@set": [
      {
        url: "https://swapi.dev/api/films/1/",
        director: "George Lucas",
        name: "A New Hope",
      },
      {
        url: "https://swapi.dev/api/films/6/",
        director: "George Lucas",
        name: "Revenge of the Sith",
      },
    ],
    // Now this is arguably a lie: it's not the real count of this collection,
    // it's the count of what we found after *filtering* the collection.
    //
    // Of course, GraphQL does the same thing, albeit with less-specified
    // semantics: if you pass arguments to a field, it changes what the field
    // produces, but that's not described in the resulting data. You have to
    // know that that's how you got the data. Is that okay?
    //
    // In GraphQL, it helps that you *can* alias the fields. That means you can
    // give it a more meaningful name, and crucially also means that you can
    // request the same field twice with different arguments and get both
    // responses.
    "@count": "2",
  },
};
