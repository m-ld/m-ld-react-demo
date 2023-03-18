import { useEffect, useState } from "react";
import {
  asSubjectUpdates,
  Reference,
  Subject,
  updateSubject,
} from "@m-ld/m-ld";
import { useMeld } from "../hooks/useMeld";
import { Observable } from "rxjs";

export const useSubject = (id: string) => {
  const meld = useMeld();
  const [data, setData] = useState<Subject & Reference>();

  useEffect(() => {
    if (meld) {
      const subscription = meld.read(
        async (state) => {
          setData(await state.get(id));
        },
        async (update, state) => {
          const newData = await state.get(id);
          validate(shape, newData);
          setData(newData);

          // TODO: This may be an expensive way to find out if there's a relevant update.
          const subjectUpdates = asSubjectUpdates(update);
          if (updateRelevantTo(update, id)) {
            setData(
              (prevData) => prevData && updateSubject({ ...prevData }, update)
            );
          }
        }
      );

      // declare const differentMeld: {
      //   updates: Observable<unknown>;
      // };

      // const subscription = differentMeld.updates.subscribe((update) => {
      //   const filtered = update.match(theSubject, thePredicate);
      // });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [meld, id]);

  return data;
};
