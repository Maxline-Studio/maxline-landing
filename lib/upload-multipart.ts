"use client";

/**
 * Envoi d'un fichier en PLUSIEURS PARTIES, en parallèle, avec réessai.
 *
 * ─── Ce qu'on remplace ───────────────────────────────────────────────────────
 * Un unique `XMLHttpRequest` PUT de tout le fichier — jusqu'à 1 Go — sans
 * découpage, sans réessai, sans reprise. Conséquences concrètes :
 *
 *  - une micro-coupure à 95 % et **tout était perdu**, il fallait recommencer
 *    depuis le début ;
 *  - une seule connexion TCP plafonne très en dessous de la bande passante
 *    réellement disponible (fenêtre de congestion, latence) : on n'utilisait
 *    qu'une fraction de la ligne.
 *
 * ─── Ce qu'on fait ───────────────────────────────────────────────────────────
 * Le fichier est découpé en parties. Plusieurs partent EN PARALLÈLE, et chaque
 * partie est réessayée INDÉPENDAMMENT en cas d'échec réseau. Une coupure ne
 * coûte plus que la partie en cours, pas le fichier entier.
 */

/** Taille d'une partie. R2/S3 imposent 5 Mo minimum (sauf la dernière) et
 * 10 000 parties maximum. 16 Mo tient les deux bouts : assez gros pour ne pas
 * multiplier les allers-retours, assez petit pour qu'un réessai reste indolore. */
export const PART_SIZE = 16 * 1024 * 1024;
/** Parties envoyées simultanément. Au-delà de 4, on sature surtout la mémoire
 * du navigateur sans gagner de débit sur une ligne domestique. */
const CONCURRENCY = 4;
/** Réessais par partie, avec attente croissante. */
const MAX_RETRIES = 3;

export type UploadedPart = { partNumber: number; etag: string };

export type MultipartCallbacks = {
  /** Signe un lot de parties (aller-retour serveur). */
  signParts: (partNumbers: number[]) => Promise<string[]>;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
};

/** Nombre de parties pour un fichier donné. */
export function partCount(size: number): number {
  return Math.max(1, Math.ceil(size / PART_SIZE));
}

/** Envoie UNE partie et renvoie son ETag. Réessaie les échecs réseau. */
async function putPart(
  url: string,
  body: Blob,
  signal: AbortSignal | undefined,
  onBytes: (delta: number) => void,
): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException("Envoi annulé", "AbortError");
    try {
      const res = await fetch(url, { method: "PUT", body, signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // L'ETag est indispensable pour l'assemblage final. Il n'est lisible que
      // parce que R2 l'expose via `access-control-expose-headers: ETag`.
      const etag = res.headers.get("ETag");
      if (!etag) {
        throw new Error(
          "ETag absent : le stockage n'expose pas l'en-tête (configuration CORS).",
        );
      }
      onBytes(body.size);
      return etag;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      lastError = err;
      if (attempt < MAX_RETRIES) {
        // Attente croissante : 0,5 s, 1 s, 2 s.
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Envoi de la partie impossible.");
}

/**
 * Envoie le fichier entier, partie par partie, et renvoie les ETags à assembler.
 *
 * La progression est calculée sur les OCTETS RÉELLEMENT confirmés, pas sur le
 * nombre de parties lancées : une barre qui avance alors que rien n'est acquis
 * est un mensonge poli.
 */
export async function uploadInParts(
  file: File,
  cb: MultipartCallbacks,
): Promise<UploadedPart[]> {
  const total = file.size;
  const count = partCount(total);
  const numbers = Array.from({ length: count }, (_, i) => i + 1);

  // On signe par lots : une seule URL par partie, mais pas 10 000 requêtes.
  const urls = new Map<number, string>();
  for (let i = 0; i < numbers.length; i += 64) {
    if (cb.signal?.aborted) throw new DOMException("Envoi annulé", "AbortError");
    const slice = numbers.slice(i, i + 64);
    const signed = await cb.signParts(slice);
    slice.forEach((n, j) => urls.set(n, signed[j]!));
  }

  let uploaded = 0;
  const onBytes = (delta: number) => {
    uploaded += delta;
    cb.onProgress?.(Math.min(99, Math.round((uploaded / total) * 100)));
  };

  const results: UploadedPart[] = new Array(count);
  let next = 0;

  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= count) return;
      const n = numbers[i]!;
      const start = (n - 1) * PART_SIZE;
      const chunk = file.slice(start, Math.min(start + PART_SIZE, total));
      const etag = await putPart(urls.get(n)!, chunk, cb.signal, onBytes);
      results[i] = { partNumber: n, etag };
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, count) }, worker),
  );
  cb.onProgress?.(100);
  return results;
}
