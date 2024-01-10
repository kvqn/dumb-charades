export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function max(a: number, b: number) {
  return a > b ? a : b
}
