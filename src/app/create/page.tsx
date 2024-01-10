import { getServerAuthSession } from "@/server/auth"
import { db } from "@/server/db"
import { redirectInGameUser } from "@/server/redirect"
import { redirect } from "next/navigation"

export default async function Page() {
  await redirectInGameUser()

  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (!loggedIn) return redirect("/login")

  const party = await db.party.create({
    data: {
      leaderId: session.user.id,
      UserParties: {
        create: {
          userId: session.user.id,
        },
      },
      Events: {
        create: {
          PartyCreateEvent: {
            create: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  })

  redirect(`/game/${party.id}`)
}
