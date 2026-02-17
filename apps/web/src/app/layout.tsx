import type { Metadata } from "next";

import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
