interface IconBadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "surface";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconBadge({
  children,
  variant = "accent",
  size = "md",
  className = ""
}: IconBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    accent: "bg-accent-100 text-accent-700",
    surface: "bg-surface-200 text-surface-700",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </div>
  );
}
