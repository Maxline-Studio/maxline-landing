import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names en évitant les conflits Tailwind.
 * Usage: cn("px-2 py-1", isActive && "bg-primary-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
