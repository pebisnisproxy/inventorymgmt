import {
  Boxes,
  Package,
  PackageOpen,
  RefreshCw,
  Search,
  Undo2
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { ProductDialog } from "./product-dialog";

const navigations = [
  {
    name: "Stok Produk",
    icon: <Boxes />,
    children: []
  },
  {
    name: "Produk Masuk",
    href: "/p/in",
    type: "in",
    icon: <Package />
  },
  {
    name: "Produk Keluar",
    href: "/p/out",
    type: "out",
    icon: <PackageOpen />
  },
  {
    name: "Produk Return",
    href: "/p/return",
    type: "return",
    icon: <Undo2 />
  }
];

export default function AppDashboard({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full min-h-screen">
      <ResizablePanel
        defaultSize={24}
        minSize={24}
        maxSize={32}
        className="p-4"
      >
        <ul className="space-y-4">
          {navigations.map((navigation) =>
            navigation.children ? (
              <li key={navigation.name}>
                <Select>
                  <SelectTrigger className="w-full font-bold">
                    <SelectValue placeholder={navigation.name} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Category</SelectLabel>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </li>
            ) : (
              <li key={navigation.name}>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href={navigation.href}>
                    {navigation.icon}
                    {navigation.name}
                  </Link>
                </Button>
              </li>
            )
          )}
        </ul>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <header className="flex items-center justify-between p-2 border-b">
          <h1 className="font-bold ml-2">{"> ivmv2"}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
