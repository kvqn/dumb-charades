import { Navbar } from "@/components/Navbar"
import { getServerAuthSession } from "@/server/auth"
import { redirectInGameUser } from "@/server/redirect"
import Link from "next/link"

export default async function HomePage() {
  // check if user is part of a game session
  await redirectInGameUser()
  return (
    <div className="flex h-screen flex-col font-virgil">
      <Navbar />
      <div className="flex w-screen flex-grow flex-col items-center justify-center gap-40">
        <div className="text-8xl font-black">Scribble Wars</div>
        <StartGame />
      </div>
    </div>
  )
}

async function StartGame() {
  const session = await getServerAuthSession()

  const loggedIn = session && session.user

  if (!loggedIn) return <Link href="/api/auth/signin">Log in to play</Link>

  return (
    <div className="flex flex-col items-center text-3xl">
      <Link href="/create" className="hover:font-black">
        Create a party
      </Link>
      <div className="cursor-pointer hover:font-black">Join a party</div>
    </div>
  )
}
