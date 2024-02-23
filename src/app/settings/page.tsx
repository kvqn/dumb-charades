import { Navbar } from "@/components/Navbar"
import { getServerAuthSession } from "@/server/auth"
import React from "react"
import { SettingsPage_ClientSide } from "./client"

export default async function Page() {
  const session = await getServerAuthSession()

  return (
    <div className="pattern-dots-sm flex h-screen w-screen flex-col bg-teal-50 font-virgil text-gray-200">
      <Navbar />
      <div className="flex h-full w-full flex-col px-[15%] py-60 text-black">
        <SettingsPage_ClientSide session={session} />
      </div>
    </div>
  )
}
