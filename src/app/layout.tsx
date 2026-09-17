import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      {/* The live app (Amplify UI) ships no webfont — its font-family stack
       * resolves to system fonts on every machine. Do not re-add next/font
       * here: the self-hosted Inter build has wider advance widths than the
       * live's resolution and visibly re-wraps text (r8; pinned by
         design-tokens.test.ts). */}
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
