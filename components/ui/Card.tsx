import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  const variantClass = {
    default: "bg-white rounded-2xl shadow-sm",
    elevated: "bg-white rounded-2xl shadow-md",
    bordered: "bg-white rounded-2xl border border-purple-100",
  }[variant];

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
