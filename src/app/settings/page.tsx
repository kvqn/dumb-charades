import { Navbar } from "@/components/Navbar"
import { TextInput } from "@/components/TextInput"
import { getServerAuthSession } from "@/server/auth"
import { db } from "@/server/db"
import { type Session } from "next-auth"
import React from "react"

export default async function Page() {
  const session = await getServerAuthSession()

  return (
    <div className="flex h-screen w-screen flex-col bg-amber-200 font-virgil">
      <Navbar />
      <div className="flex h-full w-full flex-col px-[15%] py-60">
        <UserSettings session={session}></UserSettings>
      </div>
    </div>
  )
}

function SectionWrapper({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <div className="">
      <div className="mb-4 text-5xl">{title}</div>
      <div className="rounded-xl border border-black bg-amber-100 p-12 text-3xl">
        {children}
      </div>
    </div>
  )
}

async function UserSettings({ session }: { session: Session | null }) {
  const loggedIn = session && session.user ? true : false
  const user = await db.user.findUnique({
    where: {
      id: session?.user.id,
    },
  })
  if (!loggedIn || !user)
    return (
      <div>
        <SectionWrapper title="User Settings">
          You gotta log in to change these settings.
        </SectionWrapper>
      </div>
    )
  return (
    <SectionWrapper title="User Settings">
      <div className="flex items-center gap-10">
        <div>Username</div>
        <TextInput placeholder={session?.user.name} className="" />
      </div>
    </SectionWrapper>
  )
}
