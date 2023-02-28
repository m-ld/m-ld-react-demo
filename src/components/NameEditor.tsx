import { useMeld } from "../hooks/useMeld";
import { useSubject } from "../hooks/useSubject";

// TODO: Stop cursor from jumping to end of text box.
export const NameEditor = ({ resource }: { resource: string }) => {
  // TODO: Find a type-friendly way to do this assignment.
  const { "http://xmlns.com/foaf/0.1/name": name } = useSubject(resource) ?? {};
  const meld = useMeld();

  if (typeof name !== "string") return null;
  if (!meld) return null;

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
