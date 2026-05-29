import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Nouvelle vidéo",
  robots: { index: false, follow: false },
};

export default function UploadPage() {
  return (
    <ComingSoon
      annotation="§ Nouvelle vidéo"
      sprint="Sprint 2 — à venir"
      title="Glissez. Déposez. Traduisez."
      description="L'upload de vidéo (drag & drop, formats MP4/MOV/AVI/MKV/WebM, max 1 Go et 30 min) sera disponible au Sprint 2. Le pipeline complet de traduction (Whisper.cpp + OPUS-MT en self-hosted) arrive au Sprint 3."
    />
  );
}
