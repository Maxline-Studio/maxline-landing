/**
 * Stockage objet — Cloudflare R2 (compatible S3), pour la vidéo source (et plus
 * tard burned.mp4). R2 = 10 Go gratuits + egress gratuit → le worker GCP télécharge
 * sans frais. On signe en SigV4 via `aws4fetch` (léger, fetch natif).
 *
 * IMPORTANT : ce module est SERVER-ONLY (secrets R2). Ne jamais l'importer dans un
 * composant client. L'upload navigateur se fait via URL PRÉSIGNÉE générée ici.
 *
 * Les autres fichiers (sous-titres .srt/.vtt) restent sur Supabase Storage.
 * Conventions de clés : cf. lib/storage.ts (sourceKey, burnedKey, …).
 */
import { AwsClient } from "aws4fetch";

function env(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === "") {
    throw new Error(`Variable d'environnement R2 manquante : ${key}`);
  }
  return v.trim();
}

let cached: AwsClient | null = null;
function client(): AwsClient {
  if (!cached) {
    cached = new AwsClient({
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      region: "auto",
      service: "s3",
    });
  }
  return cached;
}

/** Encode chaque segment du chemin (sans encoder les "/" séparateurs). */
function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function objectUrl(key: string): string {
  return `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env(
    "R2_BUCKET",
  )}/${encodeKey(key)}`;
}

/** URL PUT présignée pour l'upload direct navigateur → R2 (TTL long : gros fichiers). */
export async function presignPut(key: string, ttlSeconds = 7200): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  const signed = await client().sign(url.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });
  return signed.url;
}

/** URL GET présignée pour l'aperçu/lecture de la vidéo (TTL court).
 * `downloadName` force le téléchargement (Content-Disposition: attachment) avec
 * ce nom de fichier, au lieu d'ouvrir le média dans le navigateur. */
export async function presignGet(
  key: string,
  ttlSeconds = 3600,
  downloadName?: string,
): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  if (downloadName) {
    // Le paramètre est signé (donc inclus avant sign) → R2 renvoie l'en-tête.
    url.searchParams.set(
      "response-content-disposition",
      `attachment; filename="${downloadName.replace(/"/g, "")}"`,
    );
  }
  const signed = await client().sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true },
  });
  return signed.url;
}

// ─────────────────────────────────────────────────────────────────
//  Envoi en PLUSIEURS PARTIES (multipart)
// ─────────────────────────────────────────────────────────────────
/**
 * Pourquoi : l'envoi se faisait en UN SEUL PUT, jusqu'à 1 Go, sans découpage,
 * sans reprise et sans réessai. Une micro-coupure à 95 % et tout était perdu —
 * il fallait tout recommencer. C'est l'une des raisons pour lesquelles « l'import
 * est interminable ».
 *
 * Avec le découpage en parties : chaque morceau est réessayé indépendamment, et
 * plusieurs partent en parallèle (une seule connexion TCP plafonne bien en
 * dessous de la bande passante disponible).
 */

/** Extrait le contenu d'une balise XML (les réponses S3 sont en XML). */
function xmlTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1]!.trim() : null;
}

/** Ouvre un envoi multipart et renvoie son identifiant. */
export async function createMultipartUpload(
  key: string,
  contentType?: string,
): Promise<string> {
  const res = await client().fetch(`${objectUrl(key)}?uploads=`, {
    method: "POST",
    headers: contentType ? { "content-type": contentType } : undefined,
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`R2 createMultipartUpload ${res.status} : ${body.slice(0, 200)}`);
  }
  const id = xmlTag(body, "UploadId");
  if (!id) throw new Error("R2 : UploadId absent de la réponse.");
  return id;
}

/** URLs PUT présignées pour un lot de parties (numérotées à partir de 1). */
export async function presignParts(
  key: string,
  uploadId: string,
  partNumbers: number[],
  ttlSeconds = 7200,
): Promise<string[]> {
  const aws = client();
  return Promise.all(
    partNumbers.map(async (n) => {
      const url = new URL(objectUrl(key));
      url.searchParams.set("partNumber", String(n));
      url.searchParams.set("uploadId", uploadId);
      url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
      const signed = await aws.sign(url.toString(), {
        method: "PUT",
        aws: { signQuery: true },
      });
      return signed.url;
    }),
  );
}

/** Assemble les parties envoyées en un objet unique. */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
): Promise<void> {
  const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const xml =
    "<CompleteMultipartUpload>" +
    ordered
      .map(
        (p) =>
          `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`,
      )
      .join("") +
    "</CompleteMultipartUpload>";

  const res = await client().fetch(
    `${objectUrl(key)}?uploadId=${encodeURIComponent(uploadId)}`,
    { method: "POST", body: xml, headers: { "content-type": "application/xml" } },
  );
  const body = await res.text();
  // S3 peut renvoyer 200 AVEC une erreur dans le corps : il faut lire le XML.
  if (!res.ok || body.includes("<Error>")) {
    throw new Error(
      `R2 completeMultipartUpload ${res.status} : ${body.slice(0, 300)}`,
    );
  }
}

/** Abandonne un envoi multipart (libère les parties déjà stockées). */
export async function abortMultipartUpload(
  key: string,
  uploadId: string,
): Promise<void> {
  try {
    await client().fetch(
      `${objectUrl(key)}?uploadId=${encodeURIComponent(uploadId)}`,
      { method: "DELETE" },
    );
  } catch {
    /* best-effort : R2 purge seul les envois inachevés */
  }
}

/** Supprime des objets R2 (best-effort, ignore les absents/erreurs). */
export async function deleteObjects(
  keys: (string | null | undefined)[],
): Promise<void> {
  const aws = client();
  await Promise.all(
    keys
      .filter((k): k is string => typeof k === "string" && k.length > 0)
      .map(async (key) => {
        try {
          await aws.fetch(objectUrl(key), { method: "DELETE" });
        } catch {
          /* best-effort : la suppression DB reste prioritaire */
        }
      }),
  );
}
