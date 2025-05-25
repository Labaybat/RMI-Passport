import * as React from "react"

export const Input = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
})

Input.displayName = "Input"
