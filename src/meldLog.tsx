import { MeldClone } from "@m-ld/m-ld";

const stringHashCode = (s: string) => {
  var hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
const spacing = (id: string) =>
  "\u00A0".repeat(Math.abs(stringHashCode(id)) % 50);

export const meldLog = (meld: MeldClone, message: string) => {
  console.log(`${spacing(meld.dataset.id)}${message}`);
};
