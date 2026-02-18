# @useobo/providers

Target provider integrations for OBO. Includes implementations for GitHub, Supabase, and OBO itself (self-referential proof).

## Installation

```bash
npm install @useobo/providers
# or
pnpm add @useobo/providers
```

## Available Providers

### GitHub

OAuth device flow + BYOC (bring your own credential/PAT) support for GitHub repository access.

```typescript
import { GitHubProvider } from '@useobo/providers/github';

const provider = new GitHubProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

// Register with SlipService
slipService.registerProvider('github', provider);
```

### Supabase

Rogue mode provider — no credentials needed. Creates temporary Supabase tokens based on user configuration.

```typescript
import { SupabaseProvider } from '@useobo/providers/supabase';

const provider = new SupabaseProvider();

// Register with SlipService
slipService.registerProvider('supabase', provider);
```

### OBO (Self-Referential)

OBO uses OBO to manage OBO. Agents can request slips to create, list, and revoke other slips — proving the protocol works end-to-end.

```typescript
import { OBOProvider } from '@useobo/providers/obo';

const provider = new OBOProvider({
  api: {
    url: 'http://localhost:3001',
  },
  principal: 'user@example.com',
});

// Register with SlipService
slipService.registerProvider('obo', provider);
```

## Usage with MCP Server

```typescript
import { createMCPProxy } from '@useobo/providers/mcp';
import { GitHubProvider, SupabaseProvider, OBOProvider } from '@useobo/providers';

const providers = {
  github: new GitHubProvider({ /* ... */ }),
  supabase: new SupabaseProvider(),
  obo: new OBOProvider({ /* ... */ }),
};

// Create MCP-compatible proxy
const mcpProxy = createMCPProxy(providers);
```

## Provider Interface

All providers implement the `Provider` interface from `@useobo/core`:

```typescript
interface Provider {
  name: string;
  provision(params: ProvisionParams): Promise<ProvisionResult>;
  revoke?(token: string): Promise<void>;
}
```

## License

MIT
