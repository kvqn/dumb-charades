"use client"

import { useEffect, useState } from "react"

export function ChangeAfterSomeTime({
  ms,
  before,
  after,
}: {
  ms: number
  before: React.ReactNode
  after: React.ReactNode
}) {
  const [change, setChange] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChange(true)
    }, ms)
    return () => {
      clearTimeout(timeout)
    }
  }, [ms])

  return change ? after : before
}
