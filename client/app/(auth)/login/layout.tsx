export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex space-around items-center justify-center h-full w-full p-40 gap-20">
      <div className="flex-1 w-20 h-20 bg-gray-200">IMAGE</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
