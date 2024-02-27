"use server"

import { redirect } from "next/navigation"
import { db } from "../db"

export async function tryToJoinParty(partyCode: string) {
  const party = await db.party.findUnique({
    where: {
      id: partyCode,
      active: true,
    },
  })

  if (party) redirect(`/party/${partyCode}`)

  return { status: "error", message: "Invalid party code." }
}
