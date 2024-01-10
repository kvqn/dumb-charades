"use server"

import { getServerAuthSession } from "../auth"
import { db } from "../db"

export async function sendMessage(partyId: string, message: string) {
  const session = await getServerAuthSession()
  const user = session?.user

  if (!user) return

  await db.party.update({
    where: {
      id: partyId,
    },
    data: {
      Events: {
        create: {
          ChatEvent: {
            create: {
              message,
              userId: user.id,
            },
          },
        },
      },
    },
  })
}
