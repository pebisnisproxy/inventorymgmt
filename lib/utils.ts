/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
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

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  });
}
