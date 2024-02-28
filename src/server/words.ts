export type Word = {
  points: number
  word: string
  userId?: string
}

const GamingWords: Word[] = [
  { points: 200, word: "controller" },
  { points: 150, word: "avatar" },
  { points: 300, word: "multiplayer" },
  { points: 250, word: "power-up" },
  { points: 200, word: "strategy" },
  { points: 150, word: "respawn" },
  { points: 300, word: "headshot" },
  { points: 250, word: "eSports" },
  { points: 200, word: "sandbox" },
  { points: 300, word: "speedrun" },
]

const TechnologyWords: Word[] = [
  { points: 300, word: "algorithm" },
  { points: 400, word: "virtual reality" },
  { points: 450, word: "blockchain" },
  { points: 500, word: "artificial intelligence" },
  { points: 500, word: "quantum computing" },
  { points: 400, word: "machine learning" },
  { points: 450, word: "augmented reality" },
  { points: 350, word: "cloud computing" },
  { points: 400, word: "cybersecurity" },
  { points: 350, word: "IoT (Internet of Things)" },
]

export const WordCategories = ["Gaming", "Technology"]

function randomFromArray<T>(array: T[], n: number): T[] {
  const words = new Set<T>()

  while (words.size < n) {
    const word = array[Math.floor(Math.random() * array.length)]!
    words.add(word)
  }

  return Array.from(words)
}

export const getRandomWords = (
  category: "Gaming" | "Technology",
  n: number,
): Word[] => {
  if (category === "Gaming") {
    return randomFromArray(GamingWords, n)
  }
  return randomFromArray(TechnologyWords, n)
}
