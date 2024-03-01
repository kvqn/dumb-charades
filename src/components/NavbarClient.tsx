"use client"

import Link from "next/link"
import { useState } from "react"
import { AlternatingImage } from "./AlternatingImage"
import { Session } from "next-auth"
import { UserImage } from "./UserImage"
import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"

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

export function LoggedInStatus() {
  const session = useSession().data
  const loggedIn = session && session.user

  if (loggedIn)
    return (
      <div className="flex items-center gap-2">
        <UserImage scale={1.2} src={session.user.image ?? ""} />{" "}
        {session.user.name}
      </div>
    )
  return (
    <Link className="cursor-pointer hover:font-bold" href="/api/auth/signin">
      Sign In
    </Link>
  )
}
