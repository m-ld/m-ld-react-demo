import { useMeld } from "../hooks/useMeld";
import { useSubject } from "../hooks/useSubject";

// TODO: Stop cursor from jumping to end of text box.
export const NameEditor = ({ resource }: { resource: string }) => {
  const meld = useMeld();
  const person = useSubject(resource);

  // Loading...
  if (!person || !meld) return <></>;

  const { "http://xmlns.com/foaf/0.1/name": name } = person;

  // Last-minute data validation. This would be better handled higher up,
  // perhaps by validating the Person against a known shape.
  if (typeof name !== "string") return null;

  return (
    <input
      value={name}
      onChange={(e) => {
        meld.write({
          "@delete": {
            "@id": resource,
            "http://xmlns.com/foaf/0.1/name": name,
          },
          "@insert": {
            "@id": resource,
            "http://xmlns.com/foaf/0.1/name": e.target.value,
          },
        });
      }}
    />
  );
};
