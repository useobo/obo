interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({ title, subtitle, centered = false, className = "" }: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""} ${className}`}>
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base text-text-secondary sm:text-lg ${centered ? "mx-auto max-w-2xl" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
