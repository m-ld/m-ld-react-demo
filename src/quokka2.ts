({
  // Allows top-level await
  nativeEsm: true,
});

import jsonld from "jsonld";

const input = {
  "@context": {
    "@vocab": "https://swapi.dev/documentation#",
    url: "@id",
    films: { "@type": "@id" },
    /**
     * NOTE: The vehicles property is arbitrarily declared as a @list for this
     * test. It doesn't really make sense for the data, but we need to
     * demonstrate @list behavior, and there's nothing better to choose instead.
     */
    vehicles: { "@container": "@list", "@type": "@id" },
    /**
     * NOTE: This property is not in actual SWAPI at all, but we need a property
     * that points from one Person to another.
     */
    master: { "@type": "@id" },
  },
  "@graph": [
    {
      url: "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      skin_color: "fair",
      eye_color: "blue",
      films: [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/api/films/6/",
      ],
      vehicles: [
        "https://swapi.dev/api/vehicles/14/",
        "https://swapi.dev/api/vehicles/30/",
        "https://swapi.dev/api/vehicles/40/",
      ],
      master: "https://swapi.dev/api/people/10/",
    },
    {
      url: "https://swapi.dev/api/people/10/",
      name: "Obi-Wan Kenobi",
      height: "182",
      mass: "77",
      hair_color: "auburn, white",
      skin_color: "fair",
      eye_color: "blue-gray",
      birth_year: "57BBY",
      films: [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/api/films/4/",
        "https://swapi.dev/api/films/5/",
        "https://swapi.dev/api/films/6/",
      ],
      vehicles: ["https://swapi.dev/api/vehicles/38/"],
    },
    {
      url: "https://swapi.dev/api/vehicles/14/",
      name: "Snowspeeder",
      model: "t-47 airspeeder",
      manufacturer: "Incom corporation",
    },
    {
      url: "https://swapi.dev/api/vehicles/30/",
      name: "Imperial Speeder Bike",
      model: "74-Z speeder bike",
      manufacturer: "Aratech Repulsor Company",
    },
    {
      url: "https://swapi.dev/api/vehicles/38/",
      name: "Tribubble bongo",
      model: "Tribubble bongo",
      manufacturer: "Otoh Gunga Bongameken Cooperative",
    },
    {
      url: "https://swapi.dev/api/films/1/",
      title: "A New Hope",
      episode_id: 4,
      release_date: "1977-05-25",
      director: "George Lucas",
    },
    {
      url: "https://swapi.dev/api/films/2/",
      title: "The Empire Strikes Back",
      episode_id: 5,
      release_date: "1980-05-17",
      director: "Irvin Kershner",
    },
    {
      url: "https://swapi.dev/api/films/3/",
      title: "Return of the Jedi",
      episode_id: 6,
      release_date: "1983-05-25",
      director: "Richard Marquand",
    },
    {
      url: "https://swapi.dev/api/films/4/",
      title: "The Phantom Menace",
      episode_id: 1,
      release_date: "1999-05-19",
      director: "George Lucas",
    },
    {
      url: "https://swapi.dev/api/films/5/",
      title: "Attack of the Clones",
      episode_id: 2,
      release_date: "2002-05-16",
      director: "George Lucas",
    },
    {
      url: "https://swapi.dev/api/films/6/",
      title: "Revenge of the Sith",
      episode_id: 3,
      release_date: "2005-05-19",
      director: "George Lucas",
    },
  ],
};

// Tell me the names of everyone with blond hair.
const query = {
  "@context": input["@context"],
  hair_color: ["blond", "a"],
  name: {},
};

console.log(await jsonld.frame(input, query));
