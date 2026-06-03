// Typographie française : insère une espace insécable avant la ponctuation
// double (? ! : ;) et après le guillemet ouvrant « , pour éviter qu'un signe
// se retrouve seul en début de ligne. À appliquer au texte AFFICHÉ (pas au
// JSON-LD, où le texte normal suffit).
const NBSP = String.fromCharCode(160);

export function fr(s: string): string {
  return s.replace(/ ([?!:;»])/g, NBSP + "$1").replace(/(«) /g, "$1" + NBSP);
}
