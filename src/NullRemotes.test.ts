import { NullRemotes } from "./NullRemotes";
import { eachValueFrom } from "rxjs-for-await";

import { clone, MeldUpdate, uuid } from "@m-ld/m-ld";
import { MemoryLevel } from "memory-level";
import { Observable } from "rxjs";

describe("New null remotes", () => {
  test("can be cloned", async () => {
    const meld = await clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "test.example.org",
      genesis: true,
      logLevel: "SILENT",
    });

    meld.write(async (state) => {
      state = await state.write({
        "@id": "abc",
        foo: "bar",
      });
    });

    const data = await meld.get("abc");
    expect(data).toStrictEqual({
      "@id": "abc",
      foo: "bar",
    });
  });

  test("can deliver updates", async () => {
    const meld = await clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "test.example.org",
      genesis: true,
      logLevel: "SILENT",
    });

    const update$ = new Observable<MeldUpdate>((subscriber) =>
      meld.follow((update) => subscriber.next(update))
    );

    const updatesIterator = eachValueFrom(update$);

    meld.write(async (state) => {
      await state.write({
        "@id": "abc",
        foo: "bar",
      });
    });

    expect((await updatesIterator.next()).value).toMatchObject({
      "@delete": [],
      "@insert": [{ "@id": "abc", foo: "bar" }],
    });

    meld.write(async (state) => {
      await state.write({
        "@id": "abc",
        foo: "baz",
      });
    });

    expect((await updatesIterator.next()).value).toMatchObject({
      "@delete": [],
      "@insert": [{ "@id": "abc", foo: "baz" }],
    });
  });
});
