import { type Prisma } from "@prisma/client"
import { getPartyEvents } from "./actions/getPartyEvents"
import { db } from "./db"
import { max, sleep } from "./utils"

export async function gameProcess(partyId: string) {
  let lastEventId = -1

  const members = new Map<string, Prisma.UserGetPayload<object>>()
  let leaderId: string | null = null

  while (true) {
    console.log("game process is running for party", partyId)
    console.log("members", members.size)
    const events = await getPartyEvents(partyId, lastEventId)
    for (const event of events) {
      if (event.PartyCreateEvent) {
        leaderId = event.PartyCreateEvent.userId
        members.set(event.PartyCreateEvent.userId, event.PartyCreateEvent.User)
        console.log("party has been created")
      }
      if (event.PartyDestroyEvent) {
        // cleaning up is handled in @/app/destroy/page.tsx
        console.log("party destroyed")
        return
      }
      if (event.PartyLeaderChangeEvent) {
        leaderId = event.PartyLeaderChangeEvent.userId
        console.log("leader changed")
      }
      if (event.UserEnterEvent) {
        members.set(event.UserEnterEvent.userId, event.UserEnterEvent.user)
        console.log("user entered")
      }
      if (event.UserLeaveEvent) {
        members.delete(event.UserLeaveEvent.userId)
        console.log("user left")
      }

      lastEventId = max(lastEventId, event.id)
    }

    const lastSeens = await db.user.findMany({
      where: {
        id: {
          in: Array.from(members.keys()),
        },
      },
      select: {
        id: true,
        lastSeen: true,
      },
    })

    for (const lastSeen of lastSeens) {
      if (Date.now() - lastSeen.lastSeen.getTime() > 10000) {
        members.delete(lastSeen.id)
        if (lastSeen.id === leaderId) {
          leaderId = Array.from(members.keys())[0] ?? null
          if (!leaderId) {
            await db.event.create({
              data: {
                partyId: partyId,
                UserLeaveEvent: {
                  create: {
                    userId: lastSeen.id,
                  },
                },
                PartyDestroyEvent: {
                  create: {
                    userId: lastSeen.id,
                  },
                },
              },
            })
            console.log("leader left. no one else left")
            return
          } else {
            await db.event.create({
              data: {
                partyId: partyId,
                PartyLeaderChangeEvent: {
                  create: {
                    userId: leaderId,
                  },
                },
                UserLeaveEvent: {
                  create: {
                    userId: lastSeen.id,
                  },
                },
              },
            })
          }
        } else {
          await db.event.create({
            data: {
              partyId: partyId,
              UserLeaveEvent: {
                create: {
                  userId: lastSeen.id,
                },
              },
            },
          })
        }
      }
    }

    await sleep(1000)
  }
}
