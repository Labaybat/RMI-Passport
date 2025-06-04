import * as React from "react"

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`rounded-xl border bg-white shadow ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`border-b p-4 font-semibold text-lg ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "", ...props }) {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>
}

export function CardTitle({ children, className = "", ...props }) {
  return <h3 className={`text-xl font-bold text-gray-900 ${className}`} {...props}>{children}</h3>
}

export function CardDescription({ children, className = "", ...props }) {
  return <p className={`text-sm text-gray-500 ${className}`} {...props}>{children}</p>
}
