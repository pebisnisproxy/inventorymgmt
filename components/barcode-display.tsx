import { convertFileSrc } from "@tauri-apps/api/core";
import React from "react";

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

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">{productName}</h2>
      <p className="text-sm text-gray-600 mb-4">SKU: {productHandle}</p>
      <BarcodeImage
        path={imagePathForTauri}
        productName={productName}
        productHandle={productHandle}
        width={280}
        height={120}
        className="mb-2"
      />
      <p className="text-xs text-gray-500 mt-2">
        Barcode ID: {productName}-{productHandle}
      </p>
    </div>
  );
}
