import { expand } from "jsonld";

test("repro", async () => {
  await expand({
    "@context": "http://schema.org/",
    abc: "123",
  });
});
