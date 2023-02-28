import { useEffect, useState } from "react";
import {
  asSubjectUpdates,
  Reference,
  Subject,
  updateSubject,
} from "@m-ld/m-ld";
import { useMeld } from "../hooks/useMeld";

export const useSubject = (id: string) => {
  const meld = useMeld();
  const [data, setData] = useState<Subject & Reference>();

  useEffect(() => {
    if (meld) {
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
  }, [meld, id]);

  return data;
};
