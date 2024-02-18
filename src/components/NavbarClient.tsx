"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function Settings() {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
      className="flex cursor-pointer items-center gap-2"
      href="/settings"
    >
      <div className="text-lg">{hovered ? "Settings" : ""}</div>
      <Image
        src={`/static/images/${hovered ? "gear-2.png" : "gear-1.png"}`}
        height={30}
        width={30}
        alt="gear-1"
      />
    </Link>
  )
}
