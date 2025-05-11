import type { BarcodeData } from "./database";

export type GenerateBarcodeData = {
  file_path: string;
  barcode: BarcodeData | string;
  barcode_code: string;
};
