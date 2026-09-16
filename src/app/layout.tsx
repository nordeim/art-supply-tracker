import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AST Studio",
  description:
    "A studio assistant built by an artist, for artists. Track supplies, projects, notes, and creative workflows so you can spend less time searching and more time creating.",
  icons: {
    icon: "/assets/ast_logo_horizontal_cropped.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#050009",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
