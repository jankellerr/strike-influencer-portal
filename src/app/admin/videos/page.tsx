import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { Button, Card, ErrorText, Input, Label, Textarea } from "@/components/ui";

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await verifyAdminSession();
  const { error } = await searchParams;

  const videos = await prisma.tutorialVideo.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <TopBar label="Admin">
        <Link href="/admin" className="text-white/70 hover:text-white">
          ← Voltar
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="mb-4 text-lg font-bold">Vídeos tutoriais</h1>

        <Card className="mb-8">
          <form method="POST" action="/api/admin/videos">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required className="mb-4" />

            <Label htmlFor="url">Link do vídeo (YouTube, Vimeo ou arquivo .mp4)</Label>
            <Input id="url" name="url" type="url" required className="mb-4" />

            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" name="description" rows={3} className="mb-4" />

            {error === "invalid" && (
              <ErrorText>Confira os campos e tente novamente.</ErrorText>
            )}

            <Button type="submit">Adicionar vídeo</Button>
          </form>
        </Card>

        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-strike-border last:border-0">
                  <td className="px-4 py-3 font-medium">{video.title}</td>
                  <td className="px-4 py-3 text-strike-muted">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-strike-yellow decoration-2 underline-offset-2"
                    >
                      {video.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <form method="POST" action={`/api/admin/videos/${video.id}/delete`}>
                      <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                        Remover
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum vídeo ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
