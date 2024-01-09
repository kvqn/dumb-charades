"use client"

import { sleep } from "@/client/utils"
import { getLeaderId } from "@/server/actions/getLeaderId"
import { getMembers } from "@/server/actions/getMembers"
import { type Prisma } from "@prisma/client"
import { type User } from "next-auth"
import { useEffect, useState } from "react"

export function Game({ partyId, user }: { partyId: string; user: User }) {
  const [members, setMembers] = useState<Prisma.UserGetPayload<object>[]>([])
  const [leaderId, setLeaderId] = useState<string | null>(null)

  let preGamePhase = true

  useEffect(() => {
    async function _() {
      while (preGamePhase) {
        setLeaderId(await getLeaderId(partyId))
        setMembers(await getMembers(partyId))
        await sleep(5000)
      }
    }
    _()
  }, [])

  return (
    <div>
      Game
      <div>Party {partyId}</div>
      <div>
        {user.id === leaderId ? "You are the leader" : "You are a member"}
      </div>
      <div>
        Members:
        {members.map((member) => (
          <div key={member.id}>{member.name}</div>
        ))}
      </div>
    </div>
  )
}
