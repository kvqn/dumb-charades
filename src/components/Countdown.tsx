import useSound from "node_modules/use-sound/dist"
import { useEffect, useState } from "react"

export function Countdown({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [playAudio_ticking] = useSound("/static/sounds/ticking.wav")

  setTimeout(() => {
    setTimeLeft(timeLeft - 1)
  }, 1000)

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft % 2 === 0) {
      playAudio_ticking()
    }
  }, [timeLeft])

  return <div>{timeLeft}</div>
}
