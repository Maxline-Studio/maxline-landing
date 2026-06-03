// Questions fréquentes — source unique, réutilisée par la section FAQ
// (affichage) et par les données structurées FAQPage (JSON-LD).
// Le texte doit rester identique à l'affichage : le schema FAQPage doit
// refléter le contenu visible de la page.
export type FaqItem = { question: string; answer: string };

export const faqs: FaqItem[] = [
  {
    question: "Quels formats vidéo sont supportés ?",
    answer:
      "MP4, MOV, AVI, MKV et WebM, jusqu'à 1 Go et 30 minutes par vidéo. Ces limites évolueront selon les retours.",
  },
  {
    question: "Combien de temps faut-il pour une vidéo de 10 minutes ?",
    answer:
      "Environ 10 minutes, parfois moins. Notre pipeline (extraction audio → transcription → traduction → génération sous-titres → vidéo finale) est optimisé pour rester sous la durée de la vidéo elle-même.",
  },
  {
    question: "Mes vidéos sont-elles vraiment supprimées ?",
    answer:
      "Oui. Suppression automatique sous 30 jours par défaut (configurable à 7 ou 14 jours). Aucune donnée n'est conservée au-delà, et aucune n'est utilisée pour entraîner une IA. Hébergement en Europe.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, en 2 clics, sans démarche par email, sans frais. L'annulation prend effet à la fin de la période en cours. Vos crédits déjà achetés restent acquis sans expiration.",
  },
  {
    question: "Pourquoi Maxline Studio est moins cher que HeyGen ou Rask ?",
    answer:
      "Parce que nous sommes une équipe de 1 personne avec une infrastructure self-hosted minimaliste. Pas d'investisseurs à rémunérer, pas de bureaux à Manhattan. On vous facture le service, pas la levée de fonds.",
  },
  {
    question: "Maxline est-il déjà disponible ?",
    answer:
      "Oui, le studio est ouvert à tous, tout de suite — pas de liste d'attente. La première vidéo de moins de 5 minutes est offerte, sans carte bancaire.",
  },
  {
    question: "Quelles langues sont supportées ?",
    answer:
      "Dix langues : français, anglais, espagnol, allemand, italien, portugais, russe, chinois (mandarin), japonais et arabe. Vous choisissez la langue parlée et celle des sous-titres — n'importe quelle combinaison, dans les deux sens. Même langue des deux côtés = simple transcription, idéale pour l'accessibilité.",
  },
  {
    question: "Y aura-t-il un doublage avec voix clonée ?",
    answer:
      "Pas au lancement (focus sur la qualité du sous-titrage). En v2 si la traction le justifie, avec ElevenLabs en backend et consentement vocal explicite. Pas de lip-sync deepfake, jamais.",
  },
  {
    question: "Comment fonctionne l'Atelier (système de fidélité) ?",
    answer:
      "Vos minutes utilisées s'accumulent à vie. Vous progressez dans 4 rangs — Apprenti, Correcteur, Éditeur en chef, Maître d'œuvre — et à chaque palier votre outil s'enrichit de fonctions, priorités et bonus offerts (minutes supplémentaires tous les 3 mois, bonus anniversaire, exports débloqués, etc.). Inclus dans tous les plans, sans frais. Aucun reset, jamais. Le système complet est documenté en transparence : seuils, mécaniques et calculs accessibles à tous.",
  },
];
