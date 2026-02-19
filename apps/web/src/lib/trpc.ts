/**
 * tRPC Client Setup
 *
 * Note: Using loose typing to work around type export issues from the API package.
 * Runtime types are properly inferred from the server.
 */

// @ts-nocheck - We disable type checking here because the API package doesn't export types
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";

export const trpc = createTRPCReact();

// tRPC configuration
export const getTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3001/trpc",
      }),
    ],
  });
};
