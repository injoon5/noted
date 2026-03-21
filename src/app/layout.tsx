import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { getToken } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noted",
  description: "A personal knowledge base. Clean, fast, yours.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConvexClientProvider initialToken={token}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
