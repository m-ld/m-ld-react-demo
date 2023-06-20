export {};

type SelfTyped = self extends {
  a: infer A;
  [k: string]: any;
}
  ? { a: A; b?: 2 }
  : never;

const b: SelfTyped = {
  a: 1,
  //   b: 2,
};
