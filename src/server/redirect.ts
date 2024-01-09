import { redirect } from "next/navigation"
import { getServerAuthSession } from "./auth"
import { db } from "./db"

export async function redirectInGameUser() {
  const session = await getServerAuthSession()
  const loggedIn = session && session.user
  if (!loggedIn) return
  const user = session?.user

  const inGame = await db.userParties.findFirst({
    where: {
      userId: user.id,
      party: {
        active: true,
      },
    },
  })

  if (inGame) redirect(`/game/${inGame.partyId}`)
}
