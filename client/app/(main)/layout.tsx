import Sidebar from "@/components/sidebar/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ResizablePanelGroup className="h-full" direction="horizontal">
      <ResizablePanel className="h-full" defaultSize={15}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="h-full">
        <div className="rounded-full z-10 flex-1 h-full">{children}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
