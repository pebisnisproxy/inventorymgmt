"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface Invoice {
  invoice: string;
  paymentStatus: string;
  totalAmount: string;
  paymentMethod: string;
}

export default function ProductInPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      // TODO: Implement actual data fetching
      const mockData = [
        {
          invoice: "INV001",
          paymentStatus: "Paid",
          totalAmount: "$250.00",
          paymentMethod: "Credit Card"
        },
        {
          invoice: "INV002",
          paymentStatus: "Pending",
          totalAmount: "$150.00",
          paymentMethod: "PayPal"
        },
        {
          invoice: "INV003",
          paymentStatus: "Unpaid",
          totalAmount: "$350.00",
          paymentMethod: "Bank Transfer"
        }
      ];
      setInvoices(mockData);
      toast.success("Data produk masuk berhasil dimuat");
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data produk masuk", {
        description: "Silakan coba lagi atau refresh halaman"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-2">Memuat data produk masuk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">Scan Produk Masuk</h1>
      </div>
      <Table>
        <TableCaption>Histori barang yang masuk.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.totalAmount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">
              $
              {invoices
                .reduce(
                  (sum, inv) =>
                    sum + parseFloat(inv.totalAmount.replace("$", "")),
                  0
                )
                .toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
