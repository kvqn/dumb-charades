import { getServerAuthSession } from "@/server/auth"
import { db } from "@/server/db"
import Link from "next/link"
import { Game } from "./Game"

export default async function Page({
  params,
}: {
  params: { partyId: string }
}) {
  const party = await db.party.findUnique({
    where: {
      id: params.partyId,
    },
    include: {
      UserParties: true,
    },
  })

  if (!party) return <div>Party not found</div>
  if (!party.active) return <div>Party has been destroyed</div>

  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (!loggedIn) return <Link href="/api/auth/signin">Log in to play</Link>
  if (!party.UserParties.find((item) => item.userId === session.user.id)) {
    await db.userParties.create({
      data: {
        userId: session.user.id,
        partyId: party.id,
      },
    })
  }

  return (
    <div>
      <Game partyId={party.id} user={session.user} />
    </div>
  )
}
