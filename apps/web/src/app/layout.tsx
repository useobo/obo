import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/providers/trpc-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "obo - On Behalf Of",
  description: "Agentic API Governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#7a7468",
          colorText: "#2e2a26",
          colorBackground: "#f5f3f0",
          colorInputBackground: "#faf9f6",
          colorInputText: "#2e2a26",
          colorDanger: "#b91c1c",
          colorSuccess: "#047857",
          fontSize: "0.875rem",
          borderRadius: "0.75rem",
        },
        elements: {
          card: {
            background: "#faf9f6",
            border: "1px solid rgba(46, 42, 38, 0.14)",
            boxShadow: "0 16px 36px rgba(46, 42, 38, 0.08)",
          },
          headerTitle: {
            color: "#2e2a26",
            fontWeight: 600,
          },
          headerSubtitle: {
            color: "#6e6961",
          },
          socialButtonsBlockButton: {
            background: "#f5f3f0",
            border: "1px solid rgba(46, 42, 38, 0.14)",
            color: "#2e2a26",
            "&:hover": {
              background: "#eae7e2",
            },
          },
          formButtonPrimary: {
            background: "#7a7468",
            color: "#ffffff",
            fontWeight: 600,
            "&:hover": {
              background: "#5c574e",
            },
          },
          formFieldLabel: {
            color: "#6e6961",
          },
          formFieldInput: {
            background: "#faf9f6",
            border: "1px solid rgba(46, 42, 38, 0.14)",
            color: "#2e2a26",
            "&::placeholder": {
              color: "#a8a49c",
            },
            "&:focus": {
              borderColor: "rgba(122, 116, 104, 0.45)",
              outline: "none",
              boxShadow: "0 0 0 1px rgba(122, 116, 104, 0.45)",
            },
          },
          footerActionLink: {
            color: "#7a7468",
            "&:hover": {
              color: "#5c574e",
            },
          },
          dividerLine: {
            borderColor: "rgba(46, 42, 38, 0.14)",
          },
          dividerText: {
            color: "#a8a49c",
          },
          alert: {
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#b91c1c",
          },
          identityPreview: {
            background: "#f5f3f0",
            color: "#2e2a26",
          },
          identityText: {
            color: "#6e6961",
          },
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body>
          <TRPCProvider>{children}</TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
