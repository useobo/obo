import type { Metadata } from "next";

import "./globals.css";
import { TRPCProvider } from "@/providers/trpc-provider";

export const metadata: Metadata = {
  title: "OBO - On Behalf Of",
  description: "Agentic API Governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
