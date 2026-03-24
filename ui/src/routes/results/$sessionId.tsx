import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { getSessionOptions } from "@/features/playlist/queries";
import { useConversationStore } from "@/features/playlist/store";
import { VideoCard } from "@/features/playlist/components/video-card";

export const Route = createFileRoute("/results/$sessionId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getSessionOptions({
        path: { session_id: params.sessionId },
      }),
    ),
  component: ResultsRoute,
});

function ResultsRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <ResultsPage />
    </Suspense>
  );
}

function ResultsPage() {
  const { sessionId } = Route.useParams();
  const reset = useConversationStore((s) => s.reset);

  const { data: session } = useSuspenseQuery(
    getSessionOptions({
      path: { session_id: sessionId },
    }),
  );

  const playlist = session?.playlist;
  const videos = playlist?.videos ?? [];
  const topicDisplay = session?.topic
    ? session.topic.charAt(0).toUpperCase() + session.topic.slice(1)
    : "";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 bg-white border-b border-[#FECACA]">
        <span className="text-lg font-semibold text-[#1F2937] tracking-[-0.3px]">
          Make me a playlist
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-2xl bg-[#f5f5f5] px-2 py-0.5 text-xs font-semibold text-[#171717]">
            {topicDisplay}
          </span>
          <Link to="/" onClick={reset}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-4 py-2 text-sm font-medium text-[#0a0a0a] shadow-sm hover:bg-[#f0f0f0] transition-colors"
            >
              New playlist
            </button>
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-col items-center gap-6 px-20 py-8">
        {/* Title */}
        <div className="flex flex-col items-center gap-1.5 w-[900px] max-w-full">
          <h1 className="text-[32px] font-semibold text-[#1F2937] tracking-[-0.5px] text-center">
            Your curated playlist
          </h1>
          <p className="text-sm font-medium text-[#6B7280] text-center">
            {videos.length} video{videos.length !== 1 ? "s" : ""} you won't find
            in your usual recommendations
          </p>
        </div>

        {/* Overall rationale */}
        {playlist?.overall_rationale && (
          <div
            className="flex items-start gap-2.5 w-[900px] max-w-full rounded-xl bg-[#DC262615] p-4 px-5"
            data-testid="overall-rationale"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
              role="img"
              aria-label="Sparkle"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
            </svg>
            <p className="text-[13px] font-medium text-[#6B7280] leading-[1.5]">
              {playlist.overall_rationale}
            </p>
          </div>
        )}

        {/* Video list */}
        <div className="flex flex-col gap-4 w-[900px] max-w-full">
          {videos.map((video, idx) => (
            <VideoCard
              key={video.video_id}
              rank={idx + 1}
              videoId={video.video_id}
              title={video.title}
              channel={video.channel}
              durationSecs={video.duration_secs ?? null}
              viewCount={video.view_count ?? null}
              reason={video.reason}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
