import { getServerAuthSession } from "@/server/auth"
import { db } from "@/server/db"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (!loggedIn) redirect("/")

  const party = await db.party.findFirst({
    where: {
      leaderId: session.user.id,
      active: true,
    },
  })

  if (party) {
    await db.party.update({
      where: {
        id: party.id,
      },
      data: {
        active: false,
      },
    })
  }

  redirect("/")
}
