/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */
import { toast } from "sonner";

/**
 * Checks if a string contains characters that might cause file path issues
 *
 * @param input The input string to check
 * @returns True if the string contains potentially unsafe characters, false otherwise
 */
export function containsUnsafePath(input: string): boolean {
  const unsafePattern = /[/\\?%*:|"<>.,;=]/;
  return unsafePattern.test(input);
}

/**
 * Validates a product name to ensure it's safe for use in file paths
 *
 * @param name The product name to validate
 * @returns True if the name is valid, false otherwise
 */
export function validateProductName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    toast.error("Nama produk tidak boleh kosong");
    return false;
  }

  if (containsUnsafePath(name)) {
    toast.error(
      'Nama produk mengandung karakter yang tidak diperbolehkan: / \\ ? % * : | " < > . , ; ='
    );
    return false;
  }

  return true;
}

/**
 * Validates a product variant handle to ensure it's safe for use in file paths
 *
 * @param handle The variant handle to validate
 * @returns True if the handle is valid, false otherwise
 */
export function validateVariantHandle(handle: string): boolean {
  if (!handle || handle.trim().length === 0) {
    toast.error("Nama varian tidak boleh kosong");
    return false;
  }

  if (containsUnsafePath(handle)) {
    toast.error(
      'Nama varian mengandung karakter yang tidak diperbolehkan: / \\ ? % * : | " < > . , ; ='
    );
    return false;
  }

  return true;
}
