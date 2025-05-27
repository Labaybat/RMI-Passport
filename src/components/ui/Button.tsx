import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "destructive"; // Add variant prop
}

const Button: React.FC<ButtonProps> = ({
  variant = "default", // Set "default" as the fallback value
  className,
  children,
  ...props
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = clsx({
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500": variant === "default",
    "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300": variant === "ghost",
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500": variant === "destructive",
  });

  return (
    <button className={clsx(baseClasses, variantClasses, className)} {...props}>
      {children}
    </button>
  );
};

export default Button;
