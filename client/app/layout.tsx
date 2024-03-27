import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import ModalProvider from "@/components/provider/modal-provider";
import { ThemeProvider } from "@/components/provider/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Road Ready",
  // FIX: improve this
  description: "Gear Up!!! lol i dunno",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "w-screen h-screen")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* TODO: need final say, ive decided on doing this since the previous method was a little less flexible*/}
          <ModalProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
