import { Image } from "@tauri-apps/api/image";
import { exists } from "@tauri-apps/plugin-fs";
import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount);
}

export function throwUnimplemented() {
  toast.error("Still not implemented yet!");
  throw new Error("Still not implemented yet!");
}

export async function getImage(path: string) {
  const isExists = await exists(path);
  if (!isExists) {
    throw new Error("Image does not exist");
  }

  // const imageBuffer = await readFile(path);
  const image = await Image.fromPath(path);
  return image;
}
