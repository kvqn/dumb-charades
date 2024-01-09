"use server"

import { getServerAuthSession } from "../auth"
import { db, updateUserLastSeen } from "../db"

export async function getLeaderId(partyId: string): Promise<string | null> {
  const session = await getServerAuthSession()
  const user = session?.user
  if (!user) return null
  await updateUserLastSeen(user.id)

  const party = await db.party.findUnique({
    where: {
      id: partyId,
    },
    select: {
      leaderId: true,
    },
  })

  if (!party) return null

  return party.leaderId
}
