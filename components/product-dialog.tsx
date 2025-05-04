import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "./ui/badge";

type ProductDialogProps = {
  type: "in" | "out" | "return";
  trigger: React.ReactNode;
};

export function ProductDialog({ type, trigger }: ProductDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Form Barang{" "}
            {type === "in" ? "Masuk" : type === "out" ? "Keluar" : "Return"}
          </DialogTitle>
          <DialogDescription>
            Scan barcode atau masukkan kode barang
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productCode" className="text-right">
              Kode
            </Label>
            <Input
              id="productCode"
              placeholder="0123456789123"
              className="col-span-3"
            />
          </div>
          <Badge className="absolute left-4 bottom-4" variant="outline">
            {new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </Badge>
        </div>
        <DialogFooter>
          <Button type="submit">Finish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
