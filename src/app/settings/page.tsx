import { Navbar } from "@/components/Navbar"
import { getServerAuthSession } from "@/server/auth"
import React from "react"
import { SettingsPage_ClientSide } from "./client"
import Link from "next/link"

export default async function Page() {
  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  return (
    <>
      <Navbar />
      <div className="flex flex-grow flex-col px-[15%] py-60 text-black">
        {loggedIn ? (
          <SettingsPage_ClientSide session={session} />
        ) : (
          <div className="text-4xl">
            <div>You need to be logged in to see this.</div>
            <Link className="hover:font-bold " href="/api/auth/signin">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
