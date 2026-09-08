// @ts-ignore
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BHUVISION — Agentic Earth Intelligence (SIH26167)",
  description:
    "An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries (ISRO / BANKAI).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#0A0F1C] text-gray-100 antialiased">
      <body className="min-h-full flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
