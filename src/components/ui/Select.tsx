"use client"

import * as React from "react"
import * as RadixSelect from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export const Select = RadixSelect.Root

export const SelectTrigger = React.forwardRef(({ className, children, ...props }: any, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon>
      <ChevronDown className="h-4 w-4 text-gray-500" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
))

SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = RadixSelect.Value

export const SelectContent = React.forwardRef(({ className, children, ...props }: any, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={cn(
        "z-50 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in fade-in slide-in-from-top-1",
        className
      )}
      {...props}
    >
      <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
))

SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef(({ className, children, ...props }: any, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:bg-blue-100 focus:text-blue-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator className="ml-auto pl-4 text-blue-600">
      <Check className="h-4 w-4" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
))

SelectItem.displayName = "SelectItem"
