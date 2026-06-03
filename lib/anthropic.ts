// Appel minimal à l'API Anthropic (Messages) en fetch brut — même approche que
// le worker (zéro dépendance lourde). Utilisé côté serveur uniquement
// (server actions / routes) : la clé n'est JAMAIS exposée au client.
//
// La clé ANTHROPIC_API_KEY doit être présente dans l'environnement Vercel
// (Production + Preview + Development). En son absence, isAnthropicConfigured()
// renvoie false et l'appelant affiche un message clair plutôt que de crasher.

// Qualité : Claude Sonnet 4.5 par défaut (finesse culturelle/registre), aligné
// sur le worker vidéo. Overridable via ANTHROPIC_MODEL sur Vercel.
const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5-20250929";

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

type CallOpts = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

/** Appelle Claude (Messages API) et renvoie le texte concaténé. Lève en cas d'échec. */
export async function callClaude(opts: CallOpts): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY absente.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status} : ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}
