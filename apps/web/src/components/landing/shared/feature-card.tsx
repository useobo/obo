interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  highlighted?: boolean;
}

export function FeatureCard({ icon, title, description, className = "", highlighted = false }: FeatureCardProps) {
  return (
    <div className={`rounded-2xl border p-6 shadow-[0_10px_26px_rgba(46,42,38,0.07)] backdrop-blur-sm transition-all hover:shadow-lg ${
      highlighted
        ? "border-accent-300 bg-gradient-to-br from-accent-50 to-surface-50 ring-1 ring-accent-200"
        : "border-border-default bg-surface-50"
    } ${className}`}>
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
        highlighted
          ? "bg-accent-200 text-accent-800"
          : "bg-accent-100 text-accent-700"
      }`}>
        {icon}
      </div>
      <h3 className={`mb-2 text-lg font-semibold ${
        highlighted ? "text-accent-800" : "text-text-primary"
      }`}>{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
