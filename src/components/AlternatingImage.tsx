"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export function AlternatingImage({
  src1,
  src2,
  className,
  height,
  width,
}: {
  src1: string
  src2: string
  className?: string
  height: number
  width: number
}) {
  const [alternate, setAlternate] = useState(false)
  useEffect(() => {
    setTimeout(() => setAlternate(!alternate), 500)
  }, [alternate])

  return (
    <Image
      src={alternate ? src2 : src1}
      className={className}
      height={height}
      width={width}
      alt=""
    />
  )
}
