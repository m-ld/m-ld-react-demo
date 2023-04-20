import { toRDF } from "jsonld";
import { debug } from "./debug";

(async function () {
  const input = {
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
        // master: "_:obiwan",
        vehicles: [
          "https://swapi.dev/api/vehicles/14/",
          "https://swapi.dev/api/vehicles/30/",
          "https://swapi.dev/api/vehicles/40/",
        ],
      },
      {
        "@id": "https://swapi.dev/api/people/10/",
        // "@id": "_:obiwan",
        name: "Obi-Wan Kenobi",
        height: "182",
        mass: "77",
        hair_color: "auburn, white",
        skin_color: "fair",
        eye_color: "blue-gray",
        master: "https://swapi.dev/api/people/32/",
        // master: "_:quigon",
        vehicles: ["https://swapi.dev/api/vehicles/38/"],
      },
      {
        "@id": "https://swapi.dev/api/people/32/",
        // "@id": "_:quigon",
        name: "Qui-Gon Jinn",
        height: "193",
        mass: "89",
        hair_color: "brown",
        skin_color: "fair",
        eye_color: "blue",
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

  const inputQuads = await toRDF(input);

  const result = await debug(
    inputQuads,
    /* sparql */ `
      PREFIX swapi: <https://swapi.dev/documentation#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT * #?s ?p ?o ?rest
      WHERE {
        # Pick our targets.
        # FILTER(?luke = <https://swapi.dev/api/people/1/>)
        ?luke1 swapi:hair_color "blond"
        FILTER(?luke = ?luke1)

        # Luke's name, height, master, and vehicles (id)
        {
            # Pick our properties.
            VALUES ?p { swapi:name swapi:height swapi:master swapi:vehicles }

            # Get the values.
            ?s ?p ?o .

            BIND(?s AS ?luke)
            BIND("" AS ?rest)
            BIND("1" AS ?debug)
        }
        UNION
        # Luke's master's name and master (id)
        {
          # Pick our targets.
          ?luke swapi:master ?s .

          # Pick our properties.
          VALUES ?p { swapi:name swapi:master }

          # Get the values.
          ?s ?p ?o .

          BIND("" AS ?rest)
          BIND("2" AS ?debug)
        }
        UNION
        # Luke's master's master's name
        {
          # Pick our targets.
          ?luke swapi:master ?obiwan .
          ?obiwan swapi:master ?s .

          # Pick our properties.
          VALUES ?p { swapi:name }

          # Get the values.
          ?s ?p ?o .
          BIND("3" AS ?debug)
        }
        UNION
        # Luke's vehicles (id)
        {
          # Pick our targets.
          ?luke swapi:vehicles ?list .

          # Get the elements.
          ?list rdf:rest* ?node .
          ?node rdf:first ?element .
          ?node rdf:rest ?rest .

          BIND(?node AS ?s)
          BIND(?element AS ?o)
          BIND("4" AS ?debug)
        }
        UNION
        # Luke's vehicles' names
        {
          # Pick our targets.
          ?luke swapi:vehicles ?list .
          ?node rdf:first ?s .

          # Pick our properties.
          VALUES ?p { swapi:name }

          # Get the values.
          ?s ?p ?o .
          BIND("5" AS ?debug)
        }
        UNION
        # Luke's master's vehicles (id)
        {
          # Pick our targets.
          ?luke swapi:master ?obiwan .
          ?obiwan swapi:vehicles ?list .

          # Get the elements.
          ?list rdf:rest* ?node .
          ?node rdf:first ?element .
          ?node rdf:rest ?rest .

          BIND(?node AS ?s)
          BIND(?element AS ?o)
          BIND("6" AS ?debug)
        }
      }`,
    {
      sorting: ["s", "p", "o", "rest"],
      // blankNodeMode: true,
    }
  );

  console.log(result);

  // Minimally reproduce the weird luke-filter behavior

  // const minimalInput = {
  //   "@context": {
  //     "@vocab": "https://swapi.dev/documentation#",
  //     vehicles: { "@container": "@list", "@type": "@id" },
  //     master: { "@type": "@id" },
  //   },
  //   "@graph": [
  //     {
  //       "@id": "https://swapi.dev/api/people/1/",
  //       name: "Luke Skywalker",
  //       hair_color: "blond",
  //     },
  //     {
  //       "@id": "https://swapi.dev/api/people/10/",
  //       name: "Obi-Wan Kenobi",
  //       hair_color: "auburn, white",
  //     },
  //     {
  //       "@id": "https://swapi.dev/api/people/32/",
  //       name: "Qui-Gon Jinn",
  //       hair_color: "brown",
  //     },
  //   ],
  // };

  // console.log(await toRDF(minimalInput, { format: "application/n-quads" }));

  // console.log(
  //   await debug(
  //     await toRDF(minimalInput),
  //     /* sparql */ `

  // PREFIX swapi: <https://swapi.dev/documentation#>
  // PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

  // SELECT *
  // WHERE {
  //   # ?luke swapi:hair_color "blond" .
  //   {
  //       VALUES ?p { swapi:name }
  //       ?s ?p ?o .
  //       BIND(?s AS ?luke)
  //   }
  // }
  //     `,
  //     {
  //       sorting: ["s", "p", "o"],
  //     }
  //   )
  // );
})();
