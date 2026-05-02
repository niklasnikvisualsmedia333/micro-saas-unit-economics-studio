import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro-SaaS Unit Economics Studio",
  description: "Model Micro-SaaS and AI-SaaS viability without paid APIs.",
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
