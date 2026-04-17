import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-display",
});

export const metadata: Metadata = {
  title: "OnlyPaca | Private creator subscriptions on Fhenix",
  description:
    "OnlyPaca turns Fhenix CoFHE into a full creator subscription journey with relay checkout, encrypted access state, and private revenue visibility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} bg-dark-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
