/**
 * tRPC Client Setup
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@obo/api";

export const trpc = createTRPCReact<AppRouter>();

// tRPC configuration
export const getTRPCClient = () => {
  return trpc.createClient({
    links: [
      // HTTP link to our API
      async (runtime) => {
        const { httpBatchLink } = await import("@trpc/client");
        return httpBatchLink({
          url: "http://localhost:3001/trpc",
        })(runtime);
      },
    ],
  });
};
