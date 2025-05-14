import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, exists, mkdir, remove } from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";
import { toast } from "sonner";

/**
 * Sanitizes a string for safe use in file paths
 *
 * @param input The input string to sanitize
 * @returns A sanitized string safe for use in file paths
 */
export function sanitizeForPath(input: string): string {
  if (!input) return "";

  // Replace spaces, slashes, and other problematic characters
  return input
    .trim()
    .replace(/[/\\?%*:|"<>.,;=]/g, "-") // Replace unsafe chars with hyphens
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
    .replace(/_+/g, "_") // Replace multiple underscores with a single one
    .toUpperCase(); // Convert to uppercase for consistency
}

/**
 * Deletes a file at the given path, handling permissions and errors gracefully
 *
 * @param filePath The path to the file to delete
 * @returns A promise that resolves to true if the file was deleted, false otherwise
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  if (!filePath) {
    console.warn("No file path provided for deletion");
    return false;
  }

  try {
    // Check if file exists
    const fileExists = await exists(filePath);
    if (!fileExists) {
      console.warn(`File does not exist at path: ${filePath}`);
      return false;
    }

    // Delete the file
    await remove(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file at ${filePath}:`, error);
    return false;
  }
}

/**
 * Converts a file path to an asset URI that can be used in the app
 *
 * @param path The file path to convert
 * @returns The asset URI for the file
 */
export function getAssetUrl(path: string): string {
  if (!path) return "";

  try {
    return convertFileSrc(path);
  } catch (error) {
    console.error("Error converting file path to asset URL:", error);
    return "";
  }
}

/**
 * Opens a file picker dialog for images and saves the selected image to the app's data directory
 *
 * @param productName The product name to use in the file path
 * @param variantHandle The variant handle to use in the file path
 * @returns The path to the saved image file, or null if canceled or failed
 */
export async function pickAndSaveImage(
  productName: string,
  variantHandle: string
): Promise<string | null> {
  try {
    // Open file dialog to select an image
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "webp"]
        }
      ]
    });

    // User canceled the dialog
    if (!selected) {
      return null;
    }

    const sourcePath = selected as string;

    // Create the destination directory structure with sanitized paths
    const dataDir = await appDataDir();
    const sanitizedProductName = sanitizeForPath(productName);
    const sanitizedVariantHandle = sanitizeForPath(variantHandle);

    // Remove the duplicate app identifier if present in the path
    // dataDir might be something like: /Users/sena/Library/Application Support/org.lichtlabs.inventorymgmt/
    // We don't want to add the organization ID again in our path
    const basePath = dataDir.endsWith("/") ? dataDir.slice(0, -1) : dataDir;

    // Check if the app identifier is already in the path to avoid duplication
    const appIdentifier = "org.lichtlabs.inventorymgmt";
    let imgDir: string;

    if (basePath.includes(appIdentifier)) {
      // Path already contains app identifier, don't add it again
      imgDir = `${basePath}/images/${sanitizedProductName}/${sanitizedVariantHandle}`;
    } else {
      // Path doesn't contain app identifier, use the original construction
      imgDir = `${basePath}/${appIdentifier}/images/${sanitizedProductName}/${sanitizedVariantHandle}`;
    }

    console.log(`Creating directory: ${imgDir}`);

    // Create directories if they don't exist
    await mkdir(imgDir, { recursive: true });

    // Generate a unique filename to avoid collisions
    const fileExt = sourcePath.split(".").pop() || "png";
    const destFileName = `product_image_${nanoid(6)}.${fileExt}`;
    const destPath = `${imgDir}/${destFileName}`;

    console.log(`Copying from ${sourcePath} to ${destPath}`);

    // Copy the file
    await copyFile(sourcePath, destPath);
    console.log(`Successfully saved image to ${destPath}`);

    return destPath;
  } catch (error) {
    console.error("Error picking and saving image:", error);
    toast.error(
      `Failed to save image: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}
