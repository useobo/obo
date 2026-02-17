interface VisualPlaceholderProps {
  label?: string;
  aspectRatio?: "video" | "square" | "4/3";
  className?: string;
}

export function VisualPlaceholder({
  label = "Visual Placeholder",
  aspectRatio = "video",
  className = ""
}: VisualPlaceholderProps) {
  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
  };

  return (
    <div
      className={`rounded-2xl border border-border-default bg-gradient-to-br from-surface-50 to-surface-200 flex items-center justify-center ${aspectClasses[aspectRatio]} ${className}`}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-300">
          <svg
            className="h-6 w-6 text-surface-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-surface-600">{label}</p>
      </div>
    </div>
  );
}
