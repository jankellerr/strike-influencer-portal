import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getEmbedUrl } from "@/lib/videoEmbed";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";

export default async function InfluencerVideosPage() {
  await verifyInfluencerSession();

  const videos = await prisma.tutorialVideo.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <TopBar label="Como usar">
        <Link href="/dashboard" className="text-strike-yellow hover:brightness-110">
          ← Voltar ao painel
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-bold">Como usar o portal</h1>
        <p className="mb-6 text-sm text-strike-muted">
          Vídeos rápidos para te ajudar a aproveitar melhor o portal.
        </p>

        {videos.length === 0 ? (
          <Card className="text-center text-strike-muted">
            Em breve teremos vídeos tutoriais por aqui.
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {videos.map((video) => {
              const embedUrl = getEmbedUrl(video.url);
              return (
                <Card key={video.id}>
                  <h2 className="mb-2 text-base font-bold">{video.title}</h2>
                  <div className="mb-2 aspect-video overflow-hidden rounded-md bg-strike-black">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={video.url} controls className="h-full w-full" />
                    )}
                  </div>
                  {video.description && (
                    <p className="text-sm text-strike-muted">{video.description}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
