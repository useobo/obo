import Link from "next/link";

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function CTAButton({ href, children, variant = "primary", className = "" }: CTAButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-200";

  if (variant === "primary") {
    return (
      <Link
        href={href}
        className={`${baseStyles} border border-accent-600 bg-accent-500 text-white shadow-[0_10px_25px_rgba(122,116,104,0.28)] hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-[0_14px_30px_rgba(122,116,104,0.34)] ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseStyles} border border-border-default bg-surface-50 text-text-secondary hover:border-border-hover hover:bg-surface-200 ${className}`}
    >
      {children}
    </Link>
  );
}
