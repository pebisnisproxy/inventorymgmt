/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

interface DatePickerProps {
  onDateChange?: (dates: { startDate?: string; endDate?: string }) => void;
}

export function DatePicker({ onDateChange }: DatePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);

    // Call the parent callback with formatted dates if provided
    if (onDateChange) {
      const startDate = range?.from
        ? format(range.from, "yyyy-MM-dd")
        : undefined;
      const endDate = range?.to
        ? format(range.to, "yyyy-MM-dd 23:59:59")
        : range?.from
          ? format(range.from, "yyyy-MM-dd 23:59:59")
          : undefined;

      onDateChange({ startDate, endDate });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "min-w-[240px] justify-start text-left font-normal invert",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "PPP")} - {format(date.to, "PPP")}
              </>
            ) : (
              format(date.from, "PPP")
            )
          ) : (
            <span>Pilih Tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          numberOfMonths={2}
        />
        {date?.from && (
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
              className="ml-auto"
            >
              Reset
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
