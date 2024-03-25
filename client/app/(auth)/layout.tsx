export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="bg-cyan-300 w-full h-full">{children}</div>;
}
