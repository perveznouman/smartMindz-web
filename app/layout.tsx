import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RegistrationProvider } from "@/components/registration/RegistrationContext";
import { ColorManager } from "@/lib/theme/colors";
import { getCategories, getSiteContent } from "@/lib/data";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const title = `${content.orgName} — ${content.tagline}`;
  return {
    metadataBase: new URL("https://smartmindz.org"),
    title: {
      default: title,
      template: `%s · ${content.orgName}`,
    },
    description: content.heroSubtitle,
    keywords: [
      "SmartMindz",
      "Vaniyambadi",
      "talent",
      "competitions",
      "Republic Fest",
      "speech",
      "debate",
      "calligraphy",
    ],
    openGraph: {
      title,
      description: content.heroSubtitle,
      type: "website",
      images: content.logoUrl ? [content.logoUrl] : [],
    },
    icons: { icon: content.logoUrl ?? "/favicon.ico" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: ColorManager.themeColorMeta("light") },
    { media: "(prefers-color-scheme: dark)", color: ColorManager.themeColorMeta("dark") },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched once on the server and shared with the nav, footer and the
  // registration modal (categories drive the dependent dropdown).
  const [content, categories] = await Promise.all([
    getSiteContent(),
    getCategories(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        {/* Palette injected from the single source of truth: lib/theme/colors.ts */}
        <style dangerouslySetInnerHTML={{ __html: ColorManager.cssVariables() }} />
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RegistrationProvider categories={categories} content={content}>
            <div className="flex min-h-screen flex-col">
              <Navbar content={content} />
              <main className="flex-1">{children}</main>
              <Footer content={content} />
            </div>
          </RegistrationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
