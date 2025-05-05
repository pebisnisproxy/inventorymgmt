"use client";

import {
  Boxes,
  Edit,
  Package,
  PackageOpen,
  PlusCircle,
  RefreshCw,
  Search,
  Trash,
  Undo2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  function handleSelect(value: string) {
    if (value.includes("action")) {
      const action = value.split(":")[1];
      router.push(`/p/${action}`);
      return;
    }

    router.push(value);
  }

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
                <Select onValueChange={handleSelect}>
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
                      <SelectLabel>Actions</SelectLabel>
                      <SelectItem value="action:add">
                        <PlusCircle /> Add
                      </SelectItem>
                      <SelectItem value="action:edit">
                        <Edit /> Edit
                      </SelectItem>
                      <SelectItem value="action:delete">
                        <Trash /> Delete
                      </SelectItem>
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
