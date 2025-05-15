/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import Image from "next/image";

import { useBarcodeImage } from "@/lib/hooks/use-barcode-image";

interface BarcodeImageProps {
  path: string;
  productName: string;
  productHandle: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Component for displaying barcode images in the application
 *
 * @param props Component properties
 * @returns A component that displays a barcode image with loading and error states
 */
export default function BarcodeImage({
  path,
  productName,
  productHandle,
  width = 300,
  height = 120,
  className = ""
}: BarcodeImageProps) {
  const { src, loading, isError } = useBarcodeImage(path);

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        Loading...
      </div>
    );
  }

  if (isError || !src) {
    return (
      <div
        className={`bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-center p-2 ${className}`}
        style={{ width, height }}
      >
        <p className="text-sm text-gray-500">
          Unable to load barcode for
          <br />
          <span className="font-semibold">
            {productName} ({productHandle})
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={`Barcode for ${productName} (${productHandle})`}
        width={width}
        height={height}
        style={{
          objectFit: "contain",
          width: "100%",
          height: "100%"
        }}
        priority
      />
    </div>
  );
}
