// Générateur ZIP minimal, sans dépendance (méthode STORE = pas de compression).
// Suffisant pour empaqueter des fichiers de sous-titres (texte léger) : un .zip
// avec un fichier par langue. Tourne côté serveur (route Node, Buffer dispo).

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

export type ZipEntry = { name: string; content: string };

/**
 * Construit une archive ZIP (STORE) à partir d'entrées texte UTF-8.
 * Implémente : en-têtes locaux + répertoire central + EOCD (bit 11 = noms UTF-8).
 */
export function buildZip(entries: ZipEntry[]): Buffer {
  const enc = new TextEncoder();
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const data = enc.encode(e.content);
    const crc = crc32(data);

    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags : noms en UTF-8
    local.writeUInt16LE(0, 8); // méthode : STORE
    local.writeUInt16LE(0, 10); // heure
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); // taille compressée = taille brute
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    Buffer.from(nameBytes).copy(local, 30);
    locals.push(local, Buffer.from(data));

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8); // flags
    central.writeUInt16LE(0, 10); // méthode
    central.writeUInt16LE(0, 12); // heure
    central.writeUInt16LE(0, 14); // date
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk start
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // offset de l'en-tête local
    Buffer.from(nameBytes).copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }

  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature EOCD
  eocd.writeUInt16LE(0, 4); // disque
  eocd.writeUInt16LE(0, 6); // disque du répertoire central
  eocd.writeUInt16LE(entries.length, 8); // entrées sur ce disque
  eocd.writeUInt16LE(entries.length, 10); // entrées au total
  eocd.writeUInt32LE(centralDir.length, 12); // taille du répertoire central
  eocd.writeUInt32LE(offset, 16); // offset du répertoire central
  eocd.writeUInt16LE(0, 20); // commentaire

  return Buffer.concat([...locals, centralDir, eocd]);
}
