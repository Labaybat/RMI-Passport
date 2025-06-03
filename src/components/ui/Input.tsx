import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  )
})

Input.displayName = "Input"
