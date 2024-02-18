"use client"

import Link from "next/link"
import { useState } from "react"
import { AlternatingImage } from "./AlternatingImage"

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
      <AlternatingImage
        src1="/static/images/gear-1.png"
        src2="/static/images/gear-2.png"
        height={30}
        width={30}
      />
    </Link>
  )
}
