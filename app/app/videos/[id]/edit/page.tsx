import { redirect } from "next/navigation";

/**
 * L'éditeur est désormais fusionné avec la page détail de la vidéo
 * (édition directement sur /app/videos/[id]). On redirige les anciens liens.
 */
export default async function EditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/videos/${id}`);
}
