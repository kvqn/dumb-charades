"use server"

import { getServerAuthSession } from "../auth"
import { db, updateUserLastSeen } from "../db"

export async function getPartyEvents(partyId: string, lastEventId: number) {
  const session = await getServerAuthSession()
  const user = session?.user
  if (!user) return []

  await updateUserLastSeen(user.id)

  return await db.event.findMany({
    where: {
      partyId: partyId,
      id: {
        gt: lastEventId,
      },
    },
    include: {
      ChatEvent: {
        include: {
          user: true,
        },
      },
      UserEnterEvent: {
        include: {
          user: true,
        },
      },
      UserLeaveEvent: {
        include: {
          user: true,
        },
      },
      PartyLeaderChangeEvent: {
        include: {
          user: true,
        },
      },
      PartyCreateEvent: {
        include: {
          User: true,
        },
      },
      PartyDestroyEvent: {
        include: {
          User: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  })
}
