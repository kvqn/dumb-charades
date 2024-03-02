"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export function TossSpinning() {
  const frames = [
    "/static/images/toss/side.png",
    "/static/images/toss/red-half.png",
    "/static/images/toss/red-full.png",
    "/static/images/toss/red-half.png",
    "/static/images/toss/side.png",
    "/static/images/toss/blue-half.png",
    "/static/images/toss/blue-full.png",
    "/static/images/toss/blue-half.png",
  ]

  const [frame, setFrame] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      setFrame(frame + 1)
    }, 100)
  }, [frame])

  return (
    <div>
      <Image
        src={frames[frame % frames.length]!}
        height={120}
        width={120}
        alt="image"
      />
    </div>
  )
}

export function TossRed() {
  return (
    <Image
      src="/static/images/toss/red-full.png"
      height={120}
      width={120}
      alt="image"
    />
  )
}

export function TossBlue() {
  return (
    <Image
      src="/static/images/toss/blue-full.png"
      height={120}
      width={120}
      alt="image"
    />
  )
}
