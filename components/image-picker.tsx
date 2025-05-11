import { Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { pickAndSaveImage } from "@/lib/utils/file-utils";

import { Button } from "@/components/ui/button";

interface ImagePickerProps {
  productName: string;
  productHandle: string;
  initialImagePath?: string | null;
  onImageSelected?: (path: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * A component that allows users to pick an image using the Tauri file dialog
 */
export default function ImagePicker({
  productName,
  productHandle,
  initialImagePath = null,
  onImageSelected,
  className = "",
  width = 200,
  height = 200
}: ImagePickerProps) {
  const [imagePath, setImagePath] = useState<string | null>(initialImagePath);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = useCallback(async () => {
    setIsLoading(true);
    try {
      const filePath = await pickAndSaveImage(productName, productHandle);

      if (filePath) {
        setImagePath(filePath);
        if (onImageSelected) {
          onImageSelected(filePath);
        }
        toast.success("Image saved successfully");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      toast.error("Failed to pick image");
    } finally {
      setIsLoading(false);
    }
  }, [productName, productHandle, onImageSelected]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePickImage();
      }
    },
    [handlePickImage]
  );

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {imagePath ? (
        <div className="relative mb-3" style={{ width, height }}>
          <Image
            src={imagePath}
            alt={`Image for ${productName} (${productHandle})`}
            width={width}
            height={height}
            style={{
              objectFit: "contain",
              width: "100%",
              height: "100%"
            }}
            className="rounded-md border border-gray-200"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2 bg-white bg-opacity-75"
            onClick={handlePickImage}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Change"}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors p-0 mb-3 h-auto w-auto"
          style={{ width, height }}
          onClick={handlePickImage}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-gray-400 mb-2" size={32} />
          ) : (
            <ImageIcon className="text-gray-400 mb-2" size={32} />
          )}
          <p className="text-sm text-gray-500">
            {isLoading ? "Uploading..." : "Click to upload image"}
          </p>
        </Button>
      )}

      {!imagePath && (
        <Button
          variant="outline"
          onClick={handlePickImage}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon size={16} />
              Select Image
            </>
          )}
        </Button>
      )}
    </div>
  );
}
