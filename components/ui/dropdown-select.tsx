"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DropdownSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type DropdownSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownSelectOption[];
  disabled?: boolean;
  placeholder?: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  leadingIcon?: React.ReactNode;
  leadingIconClassName?: string;
  chevronClassName?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
  ariaLabel?: string;
};

export function DropdownSelect({
  value,
  onValueChange,
  options,
  disabled,
  placeholder,
  triggerClassName,
  contentClassName,
  itemClassName,
  leadingIcon,
  leadingIconClassName,
  chevronClassName,
  sideOffset = 4,
  align = "start",
  ariaLabel,
}: DropdownSelectProps) {
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "relative inline-flex h-9 w-full cursor-pointer items-center justify-between rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            leadingIcon ? "pl-9" : "",
            triggerClassName,
          )}
        >
          {leadingIcon ? (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                leadingIconClassName,
              )}
            >
              {leadingIcon}
            </span>
          ) : null}

          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption?.label ?? placeholder ?? "Select"}
          </span>

          <span className="ml-2 inline-flex shrink-0 items-center justify-center">
            <ChevronDown
              className={cn("block h-4 w-4 text-muted-foreground", chevronClassName)}
              aria-hidden="true"
            />
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={cn("w-[var(--radix-dropdown-menu-trigger-width)] min-w-40", contentClassName)}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn("cursor-pointer", itemClassName)}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
