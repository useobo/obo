/**
 * Provider avatar utilities - creates colored initials for providers
 */

// Get initials from provider name
export function getProviderInitials(name: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    openai: "AI",
    googlecloud: "GCP",
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  // For multi-word names (hyphenated), take first letter of each word
  if (name.includes("-")) {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }

  // For single words, take first 2 letters
  return name.slice(0, 2).toUpperCase();
}

// Get color for initials based on provider name
export function getProviderColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-rose-500",
  ];

  // Simple hash to get consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface ProviderAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export function ProviderAvatar({ name, size = "md" }: ProviderAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  const roundedClasses = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-lg",
  };

  return (
    <div className={`flex items-center justify-center text-white font-semibold ${getProviderColor(name)} ${sizeClasses[size]} ${roundedClasses[size]}`}>
      {getProviderInitials(name)}
    </div>
  );
}
