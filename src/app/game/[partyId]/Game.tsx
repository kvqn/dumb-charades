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

type ChatMessage = {
  createdAt: Date
  event:
    | ({
        type: "ChatEvent"
      } & Prisma.ChatEventGetPayload<{ include: { user: true } }>)
    | ({
        type: "PartyCreateEvent"
      } & Prisma.PartyCreateEventGetPayload<{ include: { User: true } }>)
    | ({
        type: "PartyDestroyEvent"
      } & Prisma.PartyDestroyEventGetPayload<{ include: { User: true } }>)
    | ({
        type: "UserEnterEvent"
      } & Prisma.UserEnterEventGetPayload<{ include: { user: true } }>)
    | ({
        type: "UserLeaveEvent"
      } & Prisma.UserLeaveEventGetPayload<{ include: { user: true } }>)
}

export function Game({ partyId, user }: { partyId: string; user: User }) {
  const [members, setMembers] = useState<Prisma.UserGetPayload<object>[]>([])
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [chatEvents, setChatEvents] = useState<ChatMessage[]>([])

  const [gameDestroyed, setGameDestroyed] = useState(false)

  const chatBoxRef = useRef<HTMLInputElement | null>(null)

  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    let lastEventId = -1
    const members = new Map<string, Prisma.UserGetPayload<object>>()
    const _chatEvents: typeof chatEvents = []
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
            _chatEvents.push({
              createdAt: event.createdAt,
              event: { type: "PartyCreateEvent", ...event.PartyCreateEvent },
            })
            setChatEvents(_chatEvents)
          }
          if (event.PartyDestroyEvent) {
            _chatEvents.push({
              createdAt: event.createdAt,
              event: { type: "PartyDestroyEvent", ...event.PartyDestroyEvent },
            })
            setGameDestroyed(true)
          }
          if (event.ChatEvent) {
            if (event.ChatEvent.user.id === user.id) setSendingMessage(false)
            _chatEvents.push({
              createdAt: event.createdAt,
              event: { type: "ChatEvent", ...event.ChatEvent },
            })
          }
          if (event.UserEnterEvent) {
            members.set(event.UserEnterEvent.user.id, event.UserEnterEvent.user)
            setMembers([...members.values()])
            _chatEvents.push({
              createdAt: event.createdAt,
              event: {
                type: "UserEnterEvent",
                ...event.UserEnterEvent,
              },
            })
          }
          if (event.UserLeaveEvent) {
            members.delete(event.UserLeaveEvent.user.id)
            setMembers([...members.values()])
            _chatEvents.push({
              createdAt: event.createdAt,
              event: {
                type: "UserLeaveEvent",
                ...event.UserLeaveEvent,
              },
            })
          }
          lastEventId = max(lastEventId, event.id)
        }
        setChatEvents(_chatEvents)
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
        <ChatMessages chatEvents={chatEvents} />
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

function Message({ message }: { message: ChatMessage }) {
  if (message.event.type === "ChatEvent") {
    return (
      <div>
        {message.event.user.name}: {message.event.message}
      </div>
    )
  }

  if (message.event.type === "PartyCreateEvent") {
    return <div>{message.event.User.name} created the party</div>
  }

  if (message.event.type === "PartyDestroyEvent") {
    return <div>Party destroyed</div>
  }

  if (message.event.type === "UserEnterEvent") {
    return <div>{message.event.user.name} entered the party</div>
  }

  if (message.event.type === "UserLeaveEvent") {
    return <div>{message.event.user.name} left the party</div>
  }

  return null
}

function ChatMessages({ chatEvents }: { chatEvents: ChatMessage[] }) {
  return (
    <div>
      {chatEvents.map((event, idx) => (
        <div key={idx}>
          <Message message={event} />
        </div>
      ))}
    </div>
  )
}
