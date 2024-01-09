import { getServerAuthSession } from "@/server/auth"
import { redirectInGameUser } from "@/server/redirect"
import Link from "next/link"

export default async function HomePage() {
  // check if user is part of a game session
  await redirectInGameUser()
  return (
    <>
      <div>Scribble Wars</div>
      <StartGame />
    </>
  )
}

async function StartGame() {
  const session = await getServerAuthSession()

  const loggedIn = session && session.user

  if (!loggedIn) return <Link href="/api/auth/signin">Log in to play</Link>

  return (
    <div>
      <div>Logged in as : {session.user.name}</div>
      <Link href="/create">Create a party</Link>
      <div>Join a party</div>
    </div>
  )
}
