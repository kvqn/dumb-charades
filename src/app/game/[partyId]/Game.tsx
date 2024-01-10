"use client"

import { sleep } from "@/client/utils"
import { getPartyEvents } from "@/server/actions/getPartyEvents"
import { sendMessage } from "@/server/actions/sendMessage"
import { type Prisma } from "@prisma/client"
import { type User } from "next-auth"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

function max(a: number, b: number) {
  return a > b ? a : b
}

export function Game({ partyId, user }: { partyId: string; user: User }) {
  const [members, setMembers] = useState<Prisma.UserGetPayload<object>[]>([])
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [chatEvents, setChatEvents] = useState<
    Prisma.ChatEventGetPayload<{ include: { user: true } }>[]
  >([])

  const [gameDestroyed, setGameDestroyed] = useState(false)

  const chatBoxRef = useRef<HTMLInputElement | null>(null)

  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    let lastEventId = -1
    const members = new Map<string, Prisma.UserGetPayload<object>>()
    const chatEvents: Prisma.ChatEventGetPayload<{
      include: { user: true }
    }>[] = []
    async function _() {
      while (true) {
        const events = await getPartyEvents(partyId, lastEventId)
        console.log(events)
        for (const event of events) {
          console.log("members", members)
          if (event.PartyCreateEvent) {
            members.set(
              event.PartyCreateEvent.User.id,
              event.PartyCreateEvent.User,
            )
            setLeaderId(event.PartyCreateEvent.userId)
            setMembers([...members.values()])
          }
          if (event.PartyDestroyEvent) {
            setGameDestroyed(true)
          }
          if (event.ChatEvent) {
            if (event.ChatEvent.user.id === user.id) setSendingMessage(false)
            chatEvents.push(event.ChatEvent)
            setChatEvents(chatEvents)
          }
          if (event.UserEnterEvent) {
            members.set(event.UserEnterEvent.user.id, event.UserEnterEvent.user)
            setMembers([...members.values()])
          }
          if (event.UserLeaveEvent) {
            members.delete(event.UserLeaveEvent.user.id)
            setMembers([...members.values()])
          }
          lastEventId = max(lastEventId, event.id)
        }
        await sleep(5000)
      }
    }
    _()
  }, [])

  if (gameDestroyed) return <div>Game destroyed</div>

  return (
    <div>
      Game
      <div>Party {partyId}</div>
      <div>
        {user.id === leaderId ? "You are the leader" : "You are a member"}
      </div>
      <div>
        {user.id === leaderId ? (
          <Link href="/destroy">Destroy Party</Link>
        ) : null}
      </div>
      <div>
        Members:
        {members.map((member, idx) => (
          <div key={idx}>{member.name}</div>
        ))}
      </div>
      <div>
        Chat:
        {chatEvents.map((event, idx) => (
          <div key={idx}>
            {event.user.name}: {event.message}
          </div>
        ))}
        {sendingMessage ? <div>Sending message...</div> : null}
        <input className="border" type="text" ref={chatBoxRef} />
        <button
          onClick={() => {
            async function _() {
              if (sendingMessage) return
              if (chatBoxRef.current?.value) {
                const message = chatBoxRef.current?.value
                chatBoxRef.current.value = ""
                setSendingMessage(true)
                await sendMessage(partyId, message)
              }
            }
            _()
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
