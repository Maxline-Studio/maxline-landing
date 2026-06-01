// Questions fréquentes — source unique, réutilisée par la section FAQ
// (affichage) et par les données structurées FAQPage (JSON-LD).
export type FaqItem = { question: string; answer: string };

export const faqs: FaqItem[] = [
  {
    question: "Est-ce que c'est vraiment automatique ?",
    answer:
      "Oui. Vous déposez votre vidéo, Maxline détecte les dialogues, les transcrit, les traduit en gardant le sens, et vous rend des sous-titres prêts à l'emploi. Vous repassez derrière seulement si vous voulez peaufiner.",
  },
  {
    question: "Quelles langues sont gérées ?",
    answer:
      "Pour l'instant, français et anglais, dans les deux sens. Vous pouvez aussi sous-titrer une vidéo dans sa langue d'origine (transcription) pour l'accessibilité. D'autres langues arriveront selon vos retours.",
  },
  {
    question: "Est-ce que je garde la main sur le texte ?",
    answer:
      "Toujours. Chaque ligne est éditable dans l'atelier. Vous corrigez, vous ajustez le découpage, vous changez le style. La machine propose, vous validez.",
  },
  {
    question: "Qu'est-ce qu'il se passe avec mes vidéos ?",
    answer:
      "Elles sont traitées puis supprimées automatiquement au bout de 30 jours. On ne revend rien, on n'entraîne aucune IA avec vos contenus. C'est écrit noir sur blanc dans nos conditions.",
  },
  {
    question: "Combien ça coûte ?",
    answer:
      "12 € par mois pour 120 minutes de vidéo. Pas de surprise, pas de prélèvement caché. Vous pouvez arrêter quand vous voulez.",
  },
  {
    question: "Et si je ne suis pas satisfait ?",
    answer:
      "Vous avez 14 jours pour tester. Si ça ne vous convient pas, vous êtes remboursé, sans discussion.",
  },
];
