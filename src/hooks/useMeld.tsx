import { createContext, useContext } from "react";
import { MeldClone } from "@m-ld/m-ld";

const MeldContext = createContext<MeldClone | undefined>(undefined);
export const useMeld = () => useContext(MeldContext);
export const MeldProvider = MeldContext.Provider;
