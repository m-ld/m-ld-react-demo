import { ReactNode } from "react";

export const Vehicle = () => {};

interface Var extends Iterable<ReactNode> {
  (query: object): object;
}

export const Person = ({ id }: { id: string }) => {
  // const name: Var = xql.useVar();
  // const vehicles: Var = xql.useVar();
  // const vehicleName: Var = xql.useVar();

  const data = xql.useQuery({
    "@id": id,
    name: "?",
    vehicles: [
      Vehicle.initialQuery,
      // {
      //   name: "?",
      // },
    ],
  });

  return (
    <div>
      <div>{data.name}</div>
      <ul>
        {data.vehicles.map((v) => (
          <li key="">
            <Vehicle data={v}></Vehicle>
          </li>
        ))}
      </ul>
    </div>
  );
};

const target = {
  message1: "hello",
  message2: "everyone",
};

const handler1: ProxyHandler<typeof target> = {
  get(target, p, receiver) {},
};

const proxy1 = new Proxy(target, handler1);
