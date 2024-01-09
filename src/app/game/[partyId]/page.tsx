import { db } from "@/server/db"
import Link from "next/link"

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

  return (
    <div>
      <div>Party {params.partyId}</div>
      <Link href="/destroy">Destroy Party</Link>
    </div>
  )
}
