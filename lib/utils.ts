import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SafeRequest } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper функция для удаления конфиденциальных полей из запросов перед передачей в клиент
export function sanitizeRequest(request: any): SafeRequest {
  const { contact_value, ...rest } = request
  return rest as SafeRequest
}

export function sanitizeRequests(requests: any[]): SafeRequest[] {
  return requests.map(sanitizeRequest)
}

