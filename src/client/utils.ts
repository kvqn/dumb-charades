import { authOptions } from "@/server/auth"

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function max(a: number, b: number) {
  return a > b ? a : b
}

export function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
