import { Navbar } from "@/components/Navbar"
import { getServerAuthSession } from "@/server/auth"
import { redirectInGameUser } from "@/server/redirect"
import { AboutTheGame, FancyTitle, StartGame } from "./client"

export default async function HomePage() {
  // check if user is part of a game session
  await redirectInGameUser()
  const session = await getServerAuthSession()
  const loggedIn = session && session.user ? true : false
  return (
    <div className="flex h-screen flex-col font-virgil">
      <Navbar showTitle={false} />
      <div className="flex w-screen flex-grow flex-col items-center justify-center">
        <FancyTitle />
        <StartGame loggedIn={loggedIn} />
        <AboutTheGame />
      </div>
    </div>
  )
}
