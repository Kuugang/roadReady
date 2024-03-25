import Sidebar from "@/components/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={"flex h-full"}>
      <Sidebar />
      {/* TODO: Possibly make this adjustable screen */}
      <div className="rounded-full z-10 flex-1">{children}</div>
    </div>
  );
}
