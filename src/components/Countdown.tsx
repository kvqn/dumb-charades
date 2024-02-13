import { useState } from "react"

export function Countdown({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  setTimeout(() => {
    setTimeLeft(timeLeft - 1)
  }, 1000)

  return <div>{timeLeft}</div>
}
