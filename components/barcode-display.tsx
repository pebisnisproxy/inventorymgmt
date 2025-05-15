/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import { convertFileSrc } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpen } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import BarcodeImage from "./barcode-image";

interface BarcodeDisplayProps {
  productName: string;
  productHandle: string;
  barcodePath: string;
}

/**
 * Component for displaying product barcodes
 * Uses Tauri's asset protocol handler to load local images
 */
export default function BarcodeDisplay({
  productName,
  productHandle,
  barcodePath
}: BarcodeDisplayProps) {
  // Convert the file path to a URL that Tauri can serve
  // This uses the asset protocol configured in tauri.conf.json
  const imagePathForTauri = React.useMemo(() => {
    try {
      // Use the native Tauri API if available
      if (typeof convertFileSrc === "function") {
        return convertFileSrc(barcodePath);
      }
      // Fallback for when not running in Tauri (e.g. during development)
      return barcodePath;
    } catch (error) {
      console.error("Error converting file path:", error);
      return barcodePath;
    }
  }, [barcodePath]);

  // Function to open the barcode file in the system's file explorer
  const handleOpenInExplorer = async () => {
    try {
      // if already exists, don't save again
      // const isExists = await exists(barcodePath.replace("-raw", ""), {
      //   baseDir: BaseDirectory.AppData
      // });
      // toast.info(`isExists: ${isExists}`);
      // if (isExists) {
      await revealItemInDir(barcodePath);
      // } else {
      //   await invoke("save_barcode_with_sku", {
      //     productName,
      //     variantName: productHandle,
      //     sku: productHandle
      //   });
      //   await revealItemInDir(barcodePath);
      // }
    } catch (error) {
      console.error("Error revealing barcode in file explorer:", error);
      toast.error("Failed to open file location");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 rounded-lg shadow bg-white">
      <h2 className="text-lg font-semibold mb-2 text-black">{productName}</h2>
      <BarcodeImage
        path={imagePathForTauri}
        productName={productName}
        productHandle={productHandle}
        width={280}
        height={120}
        className="mb-2 py-2"
      />
      <div className="flex items-center justify-between w-full mt-2">
        <p className="text-xs text-gray-500">
          Barcode ID: {productName}-{productHandle}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-xs"
          onClick={handleOpenInExplorer}
        >
          <FolderOpen className="h-3 w-3" />
          Open Location
        </Button>
      </div>
    </div>
  );
}
