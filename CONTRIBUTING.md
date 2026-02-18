# Contributing to OBO

Thank you for your interest in contributing! This document outlines how to contribute to OBO.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/useobo/obo.git
cd obo

# Install dependencies
pnpm install

# Start PostgreSQL
docker-compose up -d postgres

# Run database migrations
cd packages/db && pnpm migrate && cd ../..

# Start development servers
pnpm dev
```

This starts:
- API server on http://localhost:3001
- Web dashboard on http://localhost:3000

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/core && pnpm test
cd packages/policy && pnpm test
```

## Building

```bash
# Build all packages
pnpm build

# Build a specific package
cd packages/core && pnpm build
```

## Adding a New Provider

1. Create a new directory in `packages/providers/src/{target}/`
2. Implement the `Provider` interface from `@useobo/core/types`
3. Export from `packages/providers/src/index.ts`
4. Add package exports in `packages/providers/package.json`
5. Add tests in `packages/providers/src/{target}/test.ts`

Example:

```typescript
import type { Provider, ProvisionParams, ProvisionResult } from '@useobo/core';

export class MyProvider implements Provider {
  name = 'my-service';

  async provision(params: ProvisionParams): Promise<ProvisionResult> {
    // Implement provisioning logic
    return {
      id: 'token-id',
      token: 'actual-token',
      expiresAt: Date.now() + params.ttl * 1000,
    };
  }

  async revoke(token: string): Promise<void> {
    // Implement revocation logic
  }
}
```

## Adding a New Policy Rule

Policies use glob patterns for matching. See `packages/policy/` for implementation.

## Code Style

- Use TypeScript strict mode
- Follow existing code formatting (Prettier)
- Write tests for new features
- Update documentation

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
