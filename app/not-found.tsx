/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <SearchX className="h-20 w-20 text-gray-400 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-gray-600 mb-6">
            Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <Button asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator
          sistem.
        </p>
      </div>
    </div>
  );
}
