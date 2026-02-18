# @useobo/core

Core agentic API governance engine for OBO (On Behalf Of). Provides the fundamental types, interfaces, and slip service for managing scoped, revocable authorization tokens.

## Installation

```bash
npm install @useobo/core
# or
pnpm add @useobo/core
```

## Concepts

OBO enables AI agents (actors) to request authorization on behalf of users (principals) to access external services (targets) through scoped, revocable **slips**.

- **Principal**: Authority owner (e.g., `user@example.com`)
- **Actor**: AI agent making requests
- **Target**: Service being accessed (GitHub, Supabase, etc.)
- **Slip**: Authorization record — temporary, transferable, revocable
- **Policy**: Rules governing what actors can request
- **Token**: Actual credential presented to the target

## Usage

### Basic Slip Service

```typescript
import { SlipService, createMemoryPolicyStore } from '@useobo/core';
import type { Provider } from '@useobo/core/types';

// Create a policy store
const policyStore = createMemoryPolicyStore([
  {
    id: 'github-policy',
    principalPattern: '*',
    actorPattern: '*',
    targetPattern: 'github',
    defaultDecision: 'auto_approve',
    scopeRules: ['repo:*'],
  },
]);

// Register your providers
const providers: Map<string, Provider> = new Map();
// ... add providers

// Create the slip service
const slipService = new SlipService({
  policyStore,
  providers,
});

// Request a slip
const result = await slipService.requestSlip({
  principal: 'user@example.com',
  actor: 'claude-ai',
  target: 'github',
  requestedScopes: ['repo:read', 'repo:write'],
  ttl: 3600,
});

if (result.granted) {
  console.log('Slip ID:', result.slip.id);
  console.log('Token:', result.slip.token);
}
```

### Types

```typescript
import type {
  Principal,
  Actor,
  Target,
  Slip,
  Policy,
  Provider,
  ProvisionResult,
  PolicyDecision,
} from '@useobo/core';
```

## License

MIT
