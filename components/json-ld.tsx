// Rend un bloc de données structurées JSON-LD.
// Accepte un objet ou un tableau d'objets schema.org.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Données contrôlées côté serveur (pas d'entrée utilisateur) : injection sûre.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
