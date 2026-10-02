import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
import { getSession } from "@/lib/auth";
export const metadata: Metadata = {
  title: "Sabha · HSAPSS Canada",
  description:
    "Youth members, weekly sabhas, and the community kitchen. Together in satsang and seva.",
};
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell user={await getSession()}>{children}</Shell>
      </body>
    </html>
  );
}
