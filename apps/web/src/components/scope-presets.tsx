/**
 * Scope presets and definitions for each provider
 */

export interface ScopeOption {
  key: string;
  name: string;
  description: string;
  risk: "low" | "medium" | "high";
}

export interface ScopeGroup {
  category: string;
  scopes: ScopeOption[];
}

export interface ScopePreset {
  id: string;
  name: string;
  description: string;
  scopes: string[];
}

export interface ProviderScopes {
  presets: ScopePreset[];
  groups: ScopeGroup[];
}

// Provider scope definitions
export const providerScopes: Record<string, ProviderScopes> = {
  github: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View code, issues, and pull requests",
        scopes: ["repos:read", "user:read", "user:email"],
      },
      {
        id: "read-write",
        name: "Read + Write",
        description: "View and modify repositories and issues",
        scopes: ["repos:read", "repos:write", "user:read", "user:email"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Complete repository and administrative access",
        scopes: ["repos:read", "repos:write", "repos:delete", "admin:org", "user:read", "user:email"],
      },
    ],
    groups: [
      {
        category: "Repositories",
        scopes: [
          { key: "repos:read", name: "Read Repositories", description: "View repository code and metadata", risk: "low" },
          { key: "repos:write", name: "Write Repositories", description: "Create and edit repositories", risk: "medium" },
          { key: "repos:delete", name: "Delete Repositories", description: "Delete repositories", risk: "high" },
        ],
      },
      {
        category: "User",
        scopes: [
          { key: "user:read", name: "Read User Profile", description: "View user profile information", risk: "low" },
          { key: "user:email", name: "Read Email", description: "Access user email address", risk: "low" },
        ],
      },
      {
        category: "Organization",
        scopes: [
          { key: "admin:org", name: "Organization Admin", description: "Full organization management", risk: "high" },
        ],
      },
    ],
  },
  supabase: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View projects and database contents",
        scopes: ["projects:read", "database:read", "functions:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Complete access to projects and services",
        scopes: ["projects:read", "projects:write", "database:read", "database:write", "functions:read", "functions:write"],
      },
    ],
    groups: [
      {
        category: "Projects",
        scopes: [
          { key: "projects:read", name: "Read Projects", description: "View project information", risk: "low" },
          { key: "projects:write", name: "Write Projects", description: "Create and modify projects", risk: "medium" },
        ],
      },
      {
        category: "Database",
        scopes: [
          { key: "database:read", name: "Read Database", description: "Query database contents", risk: "medium" },
          { key: "database:write", name: "Write Database", description: "Modify database contents", risk: "high" },
        ],
      },
      {
        category: "Functions",
        scopes: [
          { key: "functions:read", name: "Read Functions", description: "View edge functions", risk: "low" },
          { key: "functions:write", name: "Write Functions", description: "Create and modify edge functions", risk: "high" },
        ],
      },
    ],
  },
  discord: {
    presets: [
      {
        id: "basic",
        name: "Basic",
        description: "View your profile and servers",
        scopes: ["identify", "guilds:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Send messages and manage servers",
        scopes: ["identify", "guilds:read", "guilds:join", "messages:write", "guilds:write"],
      },
    ],
    groups: [
      {
        category: "Identity",
        scopes: [
          { key: "identify", name: "Identity", description: "View your Discord profile", risk: "low" },
        ],
      },
      {
        category: "Servers",
        scopes: [
          { key: "guilds:read", name: "Read Servers", description: "View your servers", risk: "low" },
          { key: "guilds:join", name: "Join Servers", description: "Join new servers", risk: "medium" },
          { key: "guilds:write", name: "Manage Servers", description: "Manage server settings", risk: "high" },
        ],
      },
      {
        category: "Messages",
        scopes: [
          { key: "messages:write", name: "Send Messages", description: "Send messages on your behalf", risk: "high" },
        ],
      },
    ],
  },
  stripe: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View charges, customers, and products",
        scopes: ["charges:read", "customers:read", "products:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Manage payments and billing",
        scopes: ["charges:read", "charges:write", "customers:read", "customers:write", "refunds:write", "products:read"],
      },
    ],
    groups: [
      {
        category: "Payments",
        scopes: [
          { key: "charges:read", name: "Read Charges", description: "View payment charges", risk: "low" },
          { key: "charges:write", name: "Write Charges", description: "Create and modify charges", risk: "high" },
          { key: "refunds:write", name: "Process Refunds", description: "Issue refunds", risk: "high" },
        ],
      },
      {
        category: "Customers",
        scopes: [
          { key: "customers:read", name: "Read Customers", description: "View customer information", risk: "medium" },
          { key: "customers:write", name: "Write Customers", description: "Create and modify customers", risk: "high" },
        ],
      },
      {
        category: "Products",
        scopes: [
          { key: "products:read", name: "Read Products", description: "View products and prices", risk: "low" },
        ],
      },
    ],
  },
  slack: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View channels and messages",
        scopes: ["channels:read", "users:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Send messages and manage workspace",
        scopes: ["chat:write", "channels:read", "channels:write", "users:read", "users:write", "files:write"],
      },
    ],
    groups: [
      {
        category: "Channels",
        scopes: [
          { key: "channels:read", name: "Read Channels", description: "View channel information", risk: "low" },
          { key: "channels:write", name: "Write Channels", description: "Create and modify channels", risk: "medium" },
        ],
      },
      {
        category: "Messages",
        scopes: [
          { key: "chat:write", name: "Send Messages", description: "Send messages on your behalf", risk: "high" },
        ],
      },
      {
        category: "Users",
        scopes: [
          { key: "users:read", name: "Read Users", description: "View user information", risk: "low" },
          { key: "users:write", name: "Write Users", description: "Modify user information", risk: "high" },
        ],
      },
      {
        category: "Files",
        scopes: [
          { key: "files:write", name: "Upload Files", description: "Upload and manage files", risk: "medium" },
        ],
      },
    ],
  },
  linear: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View issues, projects, and teams",
        scopes: ["issues:read", "projects:read", "teams:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Create issues and manage projects",
        scopes: ["issues:read", "issues:write", "issues:create", "projects:read", "projects:write", "teams:read"],
      },
    ],
    groups: [
      {
        category: "Issues",
        scopes: [
          { key: "issues:read", name: "Read Issues", description: "View issues", risk: "low" },
          { key: "issues:write", name: "Write Issues", description: "Modify issues", risk: "medium" },
          { key: "issues:create", name: "Create Issues", description: "Create new issues", risk: "medium" },
        ],
      },
      {
        category: "Projects",
        scopes: [
          { key: "projects:read", name: "Read Projects", description: "View projects", risk: "low" },
          { key: "projects:write", name: "Write Projects", description: "Modify projects", risk: "medium" },
        ],
      },
      {
        category: "Teams",
        scopes: [
          { key: "teams:read", name: "Read Teams", description: "View team information", risk: "low" },
        ],
      },
    ],
  },
  notion: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View pages and databases",
        scopes: ["pages:read", "databases:read", "search"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Create and modify content",
        scopes: ["pages:read", "pages:write", "databases:read", "databases:write", "blocks:write", "search"],
      },
    ],
    groups: [
      {
        category: "Pages",
        scopes: [
          { key: "pages:read", name: "Read Pages", description: "View page content", risk: "low" },
          { key: "pages:write", name: "Write Pages", description: "Create and modify pages", risk: "medium" },
        ],
      },
      {
        category: "Databases",
        scopes: [
          { key: "databases:read", name: "Read Databases", description: "Query databases", risk: "low" },
          { key: "databases:write", name: "Write Databases", description: "Modify database entries", risk: "medium" },
        ],
      },
      {
        category: "Blocks",
        scopes: [
          { key: "blocks:write", name: "Write Blocks", description: "Create and modify content blocks", risk: "medium" },
        ],
      },
      {
        category: "Search",
        scopes: [
          { key: "search", name: "Search", description: "Search across workspace", risk: "low" },
        ],
      },
    ],
  },
  openai: {
    presets: [
      {
        id: "basic",
        name: "Basic",
        description: "Use models, chat, and embeddings",
        scopes: ["models:read", "chat:create", "embeddings:create"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Manage assistants and fine-tuning",
        scopes: ["models:read", "chat:create", "embeddings:create", "assistants:write", "fine-tunes:write"],
      },
    ],
    groups: [
      {
        category: "Models",
        scopes: [
          { key: "models:read", name: "Read Models", description: "List and view models", risk: "low" },
        ],
      },
      {
        category: "Inference",
        scopes: [
          { key: "chat:create", name: "Create Chat", description: "Create chat completions", risk: "low" },
          { key: "embeddings:create", name: "Create Embeddings", description: "Generate embeddings", risk: "low" },
        ],
      },
      {
        category: "Management",
        scopes: [
          { key: "assistants:write", name: "Manage Assistants", description: "Create and modify assistants", risk: "medium" },
          { key: "fine-tunes:write", name: "Manage Fine-tunes", description: "Create and manage fine-tuning jobs", risk: "high" },
        ],
      },
    ],
  },
  huggingface: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View models and datasets",
        scopes: ["repos:read", "models:read", "datasets:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Upload models and manage inference",
        scopes: ["repos:read", "repos:write", "models:read", "models:write", "datasets:read", "inference:manage"],
      },
    ],
    groups: [
      {
        category: "Repositories",
        scopes: [
          { key: "repos:read", name: "Read Repos", description: "View repositories", risk: "low" },
          { key: "repos:write", name: "Write Repos", description: "Create and modify repositories", risk: "medium" },
        ],
      },
      {
        category: "Models",
        scopes: [
          { key: "models:read", name: "Read Models", description: "Access model information", risk: "low" },
          { key: "models:write", name: "Write Models", description: "Upload and modify models", risk: "high" },
        ],
      },
      {
        category: "Datasets",
        scopes: [
          { key: "datasets:read", name: "Read Datasets", description: "Access datasets", risk: "low" },
        ],
      },
      {
        category: "Inference",
        scopes: [
          { key: "inference:manage", name: "Manage Inference", description: "Manage inference endpoints", risk: "high" },
        ],
      },
    ],
  },
  twitch: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View channels and chat",
        scopes: ["channel:read", "chat:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Send chat and manage channel",
        scopes: ["channel:read", "channel:write", "chat:read", "chat:write", "moderator:write"],
      },
    ],
    groups: [
      {
        category: "Channel",
        scopes: [
          { key: "channel:read", name: "Read Channel", description: "View channel information", risk: "low" },
          { key: "channel:write", name: "Write Channel", description: "Modify channel settings", risk: "high" },
        ],
      },
      {
        category: "Chat",
        scopes: [
          { key: "chat:read", name: "Read Chat", description: "View chat messages", risk: "low" },
          { key: "chat:write", name: "Write Chat", description: "Send chat messages", risk: "medium" },
        ],
      },
      {
        category: "Moderation",
        scopes: [
          { key: "moderator:write", name: "Moderator Actions", description: "Perform moderation actions", risk: "high" },
        ],
      },
    ],
  },
  googlecloud: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View storage, logs, and metrics",
        scopes: ["storage:read", "logging:read", "monitoring:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Manage cloud resources",
        scopes: ["storage:read", "storage:write", "compute:write", "bigquery:write", "logging:read", "monitoring:read"],
      },
    ],
    groups: [
      {
        category: "Storage",
        scopes: [
          { key: "storage:read", name: "Read Storage", description: "Access cloud storage", risk: "low" },
          { key: "storage:write", name: "Write Storage", description: "Modify storage contents", risk: "high" },
        ],
      },
      {
        category: "Compute",
        scopes: [
          { key: "compute:write", name: "Manage Compute", description: "Manage compute resources", risk: "high" },
        ],
      },
      {
        category: "Analytics",
        scopes: [
          { key: "bigquery:write", name: "Write BigQuery", description: "Run BigQuery operations", risk: "high" },
        ],
      },
      {
        category: "Observability",
        scopes: [
          { key: "logging:read", name: "Read Logs", description: "View logs", risk: "low" },
          { key: "monitoring:read", name: "Read Metrics", description: "View monitoring metrics", risk: "low" },
        ],
      },
    ],
  },
  strava: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View activities and profile",
        scopes: ["activities:read", "profile:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Create activities and modify profile",
        scopes: ["activities:read", "activities:write", "profile:read", "profile:write"],
      },
    ],
    groups: [
      {
        category: "Activities",
        scopes: [
          { key: "activities:read", name: "Read Activities", description: "View your activities", risk: "low" },
          { key: "activities:write", name: "Write Activities", description: "Create and modify activities", risk: "medium" },
        ],
      },
      {
        category: "Profile",
        scopes: [
          { key: "profile:read", name: "Read Profile", description: "View profile information", risk: "low" },
          { key: "profile:write", name: "Write Profile", description: "Modify profile", risk: "medium" },
        ],
      },
    ],
  },
  vercel: {
    presets: [
      {
        id: "read-only",
        name: "Read Only",
        description: "View projects and deployments",
        scopes: ["projects:read", "deployments:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Deploy and manage projects",
        scopes: ["projects:read", "projects:write", "deployments:read", "deployments:write", "deployment:trigger"],
      },
    ],
    groups: [
      {
        category: "Projects",
        scopes: [
          { key: "projects:read", name: "Read Projects", description: "View project information", risk: "low" },
          { key: "projects:write", name: "Write Projects", description: "Create and modify projects", risk: "high" },
        ],
      },
      {
        category: "Deployments",
        scopes: [
          { key: "deployments:read", name: "Read Deployments", description: "View deployment history", risk: "low" },
          { key: "deployments:write", name: "Write Deployments", description: "Manage deployments", risk: "high" },
          { key: "deployment:trigger", name: "Trigger Deployments", description: "Trigger new deployments", risk: "high" },
        ],
      },
    ],
  },
  obo: {
    presets: [
      {
        id: "basic",
        name: "Basic",
        description: "View slips and policies",
        scopes: ["slips:list", "slips:create", "policies:read", "dashboard:read"],
      },
      {
        id: "full-access",
        name: "Full Access",
        description: "Manage slips and policies",
        scopes: ["slips:list", "slips:create", "slips:revoke", "policies:read", "policies:write", "dashboard:read"],
      },
    ],
    groups: [
      {
        category: "Slips",
        scopes: [
          { key: "slips:list", name: "List Slips", description: "View all slips", risk: "low" },
          { key: "slips:create", name: "Create Slips", description: "Create new slips", risk: "medium" },
          { key: "slips:revoke", name: "Revoke Slips", description: "Revoke slips", risk: "high" },
        ],
      },
      {
        category: "Policies",
        scopes: [
          { key: "policies:read", name: "Read Policies", description: "View policies", risk: "low" },
          { key: "policies:write", name: "Write Policies", description: "Create and modify policies", risk: "high" },
        ],
      },
      {
        category: "Dashboard",
        scopes: [
          { key: "dashboard:read", name: "Read Dashboard", description: "Access dashboard", risk: "low" },
        ],
      },
    ],
  },
};

// Get scopes for a provider, with defaults for unknown providers
export function getProviderScopes(providerName: string): ProviderScopes {
  return providerScopes[providerName] || {
    presets: [
      {
        id: "default",
        name: "Default Access",
        description: `Standard access to ${providerName}`,
        scopes: ["read", "write"],
      },
    ],
    groups: [
      {
        category: "General",
        scopes: [
          { key: "read", name: "Read", description: "Read access", risk: "low" },
          { key: "write", name: "Write", description: "Write access", risk: "medium" },
        ],
      },
    ],
  };
}

// Provider categories
export const providerCategories: Record<string, string> = {
  github: "Developer Tools",
  supabase: "Database",
  discord: "Communication",
  stripe: "Payments",
  slack: "Communication",
  linear: "Developer Tools",
  notion: "Productivity",
  openai: "AI",
  huggingface: "AI",
  twitch: "Streaming",
  googlecloud: "Cloud",
  strava: "Fitness",
  vercel: "Developer Tools",
  obo: "Internal",
};
