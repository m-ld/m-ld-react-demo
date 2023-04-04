import { useEffect, useState } from "react";
import {
  asSubjectUpdates,
  Reference,
  Subject,
  updateSubject,
} from "@m-ld/m-ld";
import { useMeld } from "../hooks/useMeld";
import { Iri } from "@m-ld/jsonld/jsonld-spec";

// null or undefined means "skip"
export const useSubject = (
  subjectReference: Iri | Reference | null | undefined
) => {
  const meld = useMeld();
  const [data, setData] = useState<Subject & Reference>();

  const id =
    subjectReference === null || typeof subjectReference === "undefined"
      ? null
      : typeof subjectReference === "string"
      ? subjectReference
      : subjectReference["@id"];

  useEffect(() => {
    if (!meld || !id) {
      setData(undefined);
    } else {
      const subscription = meld.read(
        async (state) => {
          setData(await state.get(id));
        },
        async (update) => {
          // TODO: This may be an expensive way to find out if there's a relevant update.
          const subjectUpdates = asSubjectUpdates(update);
          if (subjectUpdates[id]) {
            setData(
              (prevData) =>
                prevData && updateSubject({ ...prevData }, subjectUpdates)
            );
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id, meld]);

  return data;
};
