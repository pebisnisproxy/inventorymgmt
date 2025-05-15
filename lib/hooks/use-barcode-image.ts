/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";

interface UseBarcodeImageOptions {
  fallback?: string;
}

/**
 * Custom hook to handle barcode images in a Tauri application
 *
 * @param path The path to the barcode image file
 * @param options Additional options
 * @returns An object containing the image source and loading state
 */
export function useBarcodeImage(
  path: string,
  options: UseBarcodeImageOptions = {}
) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadImage() {
      if (!path) {
        if (mounted) {
          setLoading(false);
          setError(new Error("No image path provided"));
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // In Tauri apps, we can just use the path directly
        // The path is passed to the HTML img tag and Tauri's IPC will handle the file access
        if (mounted) {
          setSrc(path);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading barcode image:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setSrc(options.fallback || null);
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      mounted = false;
    };
  }, [path, options.fallback]);

  return {
    src,
    loading,
    error,
    isError: !!error
  };
}
