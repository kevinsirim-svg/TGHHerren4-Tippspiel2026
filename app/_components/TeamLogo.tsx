import { teamLogoUrl } from "@/lib/teams/info";

export function TeamLogo({
  abbreviation,
  size = 40,
  className = "",
}: {
  abbreviation: string;
  size?: number;
  className?: string;
}) {
  const url = teamLogoUrl(abbreviation);
  if (!url) {
    return (
      <span
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center rounded-full bg-zinc-200 text-xs font-bold dark:bg-zinc-700 ${className}`}
      >
        {abbreviation}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={abbreviation}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
}
