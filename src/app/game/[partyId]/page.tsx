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
  })

  if (!party) return <div>Party not found</div>
  if (!party.active) return <div>Party has been destroyed</div>

  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (!loggedIn) return <Link href="/api/auth/signin">Log in to play</Link>

  await db.party.update({
    where: {
      id: party.id,
    },
    data: {
      Events: {
        create: {
          UserEnterEvent: {
            create: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  })

  return (
    <div>
      <Game partyId={party.id} user={session.user} />
    </div>
  )
}
