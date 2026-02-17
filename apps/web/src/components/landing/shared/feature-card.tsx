interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className = "" }: FeatureCardProps) {
  return (
    <div className={`rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_26px_rgba(46,42,38,0.07)] backdrop-blur-sm ${className}`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
