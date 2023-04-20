({
  stdEsm: false,
  nativeEsm: true,
  env: {
    params: {
      runner: "--experimental-specifier-resolution=node",
    },
  },
});

import debug = require("./debug");
// import { debug } from "./debug";
import { JsonLdDocument, toRDF } from "jsonld";

debug;

const input: JsonLdDocument = {
  "@context": {
    "@vocab": "https://swapi.dev/documentation#",
    vehicles: { "@container": "@list", "@type": "@id" },
    master: { "@type": "@id" },
  },
  "@graph": [
    {
      "@id": "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      skin_color: "fair",
      eye_color: "blue",
      master: "https://swapi.dev/api/people/10/",
      vehicles: [
        "https://swapi.dev/api/vehicles/14/",
        "https://swapi.dev/api/vehicles/30/",
        "https://swapi.dev/api/vehicles/40/",
      ],
    },
    {
      "@id": "https://swapi.dev/api/people/10/",
      name: "Obi-Wan Kenobi",
      height: "182",
      mass: "77",
      hair_color: "auburn, white",
      skin_color: "fair",
      eye_color: "blue-gray",
      birth_year: "57BBY",
      vehicles: ["https://swapi.dev/api/vehicles/38/"],
    },
    {
      "@id": "https://swapi.dev/api/vehicles/14/",
      name: "Snowspeeder",
      model: "t-47 airspeeder",
      manufacturer: "Incom corporation",
    },
    {
      "@id": "https://swapi.dev/api/vehicles/30/",
      name: "Imperial Speeder Bike",
      model: "74-Z speeder bike",
      manufacturer: "Aratech Repulsor Company",
    },
    {
      "@id": "https://swapi.dev/api/vehicles/38/",
      name: "Tribubble bongo",
      model: "Tribubble bongo",
      manufacturer: "Otoh Gunga Bongameken Cooperative",
    },
  ],
};

const query = {
  "@context": input["@context"],
  "@id": "https://swapi.dev/api/people/1/",
  name: {},
  vehicles: {},
};

// const inputTurtle = /* turtle */ `
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#eye_color> "blue" .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#hair_color> "blond" .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#height> "172" .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#mass> "77" .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#name> "Luke Skywalker" .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#skin_color> "fair" .
//   _:n0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/14/> .
//   _:n0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:n1 .
//   _:n1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/30/> .
//   _:n1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:n2 .
//   _:n2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://swapi.dev/api/vehicles/40/> .
//   _:n2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#vehicles> _:n0 .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#favorite_vehicle> <https://swapi.dev/api/vehicles/14/> .
//   <https://swapi.dev/api/people/1/> <https://swapi.dev/documentation#favorite_vehicle> <https://swapi.dev/api/vehicles/30/> .
//   <https://swapi.dev/api/vehicles/14/> <https://swapi.dev/documentation#manufacturer> "Incom corporation" .
//   <https://swapi.dev/api/vehicles/14/> <https://swapi.dev/documentation#model> "t-47 airspeeder" .
//   <https://swapi.dev/api/vehicles/14/> <https://swapi.dev/documentation#name> "Snowspeeder" .
//   <https://swapi.dev/api/vehicles/30/> <https://swapi.dev/documentation#manufacturer> "Aratech Repulsor Company" .
//   <https://swapi.dev/api/vehicles/30/> <https://swapi.dev/documentation#model> "74-Z speeder bike" .
//   <https://swapi.dev/api/vehicles/30/> <https://swapi.dev/documentation#name> "Imperial Speeder Bike" .
//   <https://swapi.dev/api/people/2/> <https://swapi.dev/documentation#vehicles> _:xn0 .
//   _:xn0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <ex:somethingElse> .
//   _:xn0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .
// `;

// const graphqlldSparql = toSparql(
//   await new Converter().graphqlToSparqlAlgebra(
//     /* graphql */ `
//     {
//       name
//       # vehicles {
//       # }
//       # favorite_vehicle {
//       #   name
//       # }
//     }
//     `,
//     {
//       "@vocab": "https://swapi.dev/documentation#",
//       first: "http://www.w3.org/1999/02/22-rdf-syntax-ns#first",
//       rest: "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest",
//     }
//   )
// );

// console.log(graphqlldSparql);

// console.log(await debug(inputTurtle, graphqlldSparql));

// {
//   "@context": input["@context"],
//   "@id": "https://swapi.dev/api/people/1/",
//   name: {},
//   vehicles: {},
// }

const inputTurtle = await toRDF(input);

console.log(
  await debug(
    inputTurtle,
    /* sparql */ `
          PREFIX swapi: <https://swapi.dev/documentation#>
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

          SELECT *
          WHERE {
            {
              BIND(swapi:master as ?p)
              ?s ?p ?o .
              ?s swapi:eye_color "blue" .
              BIND("" as ?element)
              BIND("" as ?rest)
            }
            UNION
            {
              BIND(swapi:vehicles as ?p)
              ?s swapi:vehicles ?o .
              ?o rdf:rest* ?node .
              ?node rdf:first ?element .
              ?node rdf:rest ?rest .
              ?s swapi:eye_color "blue" .
            }
            # {
              # BOOKMARK: Why does this make the vehicle ones go away?
              # ?s swapi:eye_color "blue" .
            # }
          }

          # SELECT
          #   ?s
          #   ?p
          #   ?o
          #   # # ?node
          #   # # ?element
          #   # # ?rest
          #   # # ?fav
          #   # #?apple·sauce
          # WHERE {
          #   # BOOKMARK: Can we somehow only bind ?s to the node we're looking at for its queries and then also bind it to deeper things later?
          #   {
          #     VALUES ?p1 { swapi:vehicles swapi:name swapi:favorite_vehicle }

          #     # Parent filters
          #     # BIND(<https://swapi.dev/api/people/2/> AS ?s)
          #     ?s1 swapi:eye_color "blue" .

          #     ?s1 ?p1 ?o1 .
              
          #       # Get value
          #       BIND(?s1 AS ?s)
          #       BIND(?p1 AS ?p)
          #       BIND(?o1 AS ?o)
          #       # ?s ?p ?o .
          #     # UNION
          #     # {
          #     #   # FILTER(?p1 = swapi:favorite_vehicle)
          #     #   # BIND(?o1 AS ?s2)
          #     #   VALUES ?p2 { swapi:name }
          #     #   # OPTIONAL {
          #     #     ?s2 ?p2 ?o2 .
          #     #     BIND(?s2 AS ?s)
          #     #     BIND(?p2 AS ?p)
          #     #     BIND(?o2 AS ?o)
          #     #   # }
          #     # }

          #   }

            # {
            #   ?s swapi:favorite_vehicle/swapi:name ?o
            # }
            # ?s swapi:favorite_vehicle ?fav .

            # If ?o is a list, get a binding for each node in the list.
            # OPTIONAL {
            #   ?o rdf:rest* ?node .
            #   ?node rdf:first ?element .
            #   ?node rdf:rest ?rest .

            #   # OPTIONAL {
            #   #   ?first swapi:name ?apple·sauce
            #   # }
            # }
          # }
        

          # SELECT ?type ?s ?p ?o ?node ?first ?rest
          # WHERE {
          #   {
          #     SELECT ?type ?s ?p ?o
          #     WHERE {
          #       BIND("property" AS ?type)
          #       # BIND(<https://swapi.dev/api/people/1/> AS ?s)
          #       BIND(swapi:eye_color AS ?p)
          #       BIND("blue" AS ?o)
          #       ?s ?p ?o .
          #     }
          #   }
          #   UNION
          #   {
          #     SELECT ?type ?s ?p ?node ?first ?rest
          #     WHERE {
          #       BIND("list" AS ?type)
          #       # BIND(<https://swapi.dev/api/people/1/> AS ?s)
          #       BIND(swapi:vehicles AS ?p)
          #       ?s ?p ?list .
          #       ?list rdf:rest* ?node .
          #       ?node rdf:first ?first .
          #       ?node rdf:rest ?rest .
          #     }
          #   }
          # }
        `
    //     /* sparql */ `
    //   PREFIX swapi: <https://swapi.dev/documentation#>
    //   PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    //   # Nope, CONSTRUCT is still no good.
    //   CONSTRUCT {
    //     # ?s ?p ?list.
    //     ?node rdf:first ?first.
    //     ?node rdf:rest ?rest.
    //   }
    //   WHERE {
    //     {
    //       SELECT ?type ?s ?p ?list ?node ?first ?rest
    //       WHERE {
    //         BIND("list" AS ?type)
    //         # BIND(<https://swapi.dev/api/people/1/> AS ?s)
    //         BIND(swapi:vehicles AS ?p)
    //         ?s ?p ?list .
    //         ?list rdf:rest* ?node .
    //         ?node rdf:first ?first .
    //         ?node rdf:rest ?rest .
    //       }
    //     }
    //   }
    // `
  )
);
