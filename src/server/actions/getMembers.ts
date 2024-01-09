"use server"

import { type Prisma } from "@prisma/client"
import { db, updateUserLastSeen } from "../db"
import { getServerAuthSession } from "../auth"

export async function getMembers(
  partyId: string,
): Promise<Prisma.UserGetPayload<object>[]> {
  const session = await getServerAuthSession()
  const user = session?.user
  if (!user) return []
  await updateUserLastSeen(user.id)

  const membersIds = (
    await db.userParties.findMany({
      where: {
        partyId: partyId,
      },
      select: {
        userId: true,
      },
    })
  ).map((member) => member.userId)

  const members = await db.user.findMany({
    where: {
      id: {
        in: membersIds,
      },
    },
  })

  return members
}
