import { useState } from "react";

interface VideoCardProps {
  rank: number;
  videoId: string;
  title: string;
  channel: string;
  durationSecs: number | null;
  viewCount: number | null;
  reason: string;
}

function formatDuration(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M views`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

export function VideoCard({
  rank,
  videoId,
  title,
  channel,
  durationSecs,
  viewCount,
  reason,
}: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <article
      className="flex overflow-hidden rounded-2xl bg-white border border-[#FECACA]"
      data-testid="video-card"
    >
      <div className="relative w-[280px] shrink-0 h-[158px] bg-[#E5E2DC]">
        {!imgError ? (
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${title}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            data-testid="thumbnail"
          />
        ) : (
          <div className="w-full h-full bg-[#E5E2DC]" data-testid="thumbnail" />
        )}
        {durationSecs != null && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(durationSecs)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 px-5 flex-1">
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-semibold text-[#DC2626]"
            data-testid="video-rank"
          >
            {rank}
          </span>
          <h2 className="text-base font-semibold text-[#1F2937] tracking-[-0.3px] leading-[1.3]">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span
            className="font-medium text-[#6B7280]"
            data-testid="channel-name"
          >
            {channel}
          </span>
          {viewCount != null && (
            <>
              <span className="text-[#9CA3AF]">·</span>
              <span className="text-[#9CA3AF]">
                {formatViewCount(viewCount)}
              </span>
            </>
          )}
        </div>
        <div
          className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] p-2.5 px-3"
          data-testid="video-rationale"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5"
            role="img"
            aria-label="Rationale"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          <p className="text-xs text-[#6B7280] leading-[1.5]">{reason}</p>
        </div>
      </div>
    </article>
  );
}
