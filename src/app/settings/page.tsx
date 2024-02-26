import { Navbar } from "@/components/Navbar"
import { getServerAuthSession } from "@/server/auth"
import React from "react"
import { SettingsPage_ClientSide } from "./client"

export default async function Page() {
  const session = await getServerAuthSession()

  return (
    <>
      <Navbar />
      <div className="flex flex-grow flex-col px-[15%] py-60 text-black">
        <SettingsPage_ClientSide session={session} />
      </div>
    </>
  )
}
