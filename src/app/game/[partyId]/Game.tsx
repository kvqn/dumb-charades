"use client"

import type {
  ChatMessage,
  SocketChatEvent,
  SocketPartyCreateEvent,
  SocketPartyDestroyEvent,
  SocketUserEnterEvent,
  SocketUserLeaveEvent,
} from "@/types"
import { type Prisma } from "@prisma/client"
import { type User } from "next-auth"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { socket } from "@/client/socket"
import { DrawingCanvas } from "./DrawingCanvas"

export function Game({ partyId, user }: { partyId: string; user: User }) {
  const [members, setMembers] = useState<Prisma.UserGetPayload<object>[]>([])
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [chatEvents, setChatEvents] = useState<ChatMessage[]>([])

  const [gameDestroyed, setGameDestroyed] = useState(false)

  const chatBoxRef = useRef<HTMLInputElement | null>(null)

  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    socket.emit("SocketIdentify", user.id)
    const SocketIdentifyAckHandler = () => {
      socket.emit("SocketJoinParty", partyId)
    }
    socket.on("SocketIdentifyAck", SocketIdentifyAckHandler)
    console.log("socket", socket.id)
    return () => {
      socket.off("SocketIdentifyAck", SocketIdentifyAckHandler)
    }
  }, [])

  useEffect(() => {
    const SocketChatEventHandler = (event: SocketChatEvent) => {
      console.log("SocketChatEvent", event)
      setChatEvents([
        ...chatEvents,
        {
          createdAt: new Date(),
          event: {
            type: "ChatEvent",
            ...event,
          },
        },
      ])
      console.log(chatEvents)
    }
    socket.on("SocketChatEvent", SocketChatEventHandler)
    return () => {
      socket.off("SocketChatEvent", SocketChatEventHandler)
    }
  }, [chatEvents])

  useEffect(() => {
    const SocketUserEnterEventHandler = (event: SocketUserEnterEvent) => {
      if (!members.find((member) => member.id === event.userId)) {
        setMembers([...members, event.user])
        setChatEvents([
          ...chatEvents,
          {
            createdAt: new Date(),
            event: {
              type: "UserEnterEvent",
              ...event,
            },
          },
        ])
      }
    }

    const SocketUserLeaveEventHandler = (event: SocketUserLeaveEvent) => {
      setMembers(members.filter((member) => member.id !== event.userId))
      setChatEvents([
        ...chatEvents,
        {
          createdAt: new Date(),
          event: {
            type: "UserLeaveEvent",
            ...event,
          },
        },
      ])
    }

    const SocketPartyCreateEventHandler = (event: SocketPartyCreateEvent) => {
      setMembers([...members, event.User])
      setLeaderId(event.userId)
      setChatEvents([
        ...chatEvents,
        {
          createdAt: new Date(),
          event: {
            type: "PartyCreateEvent",
            ...event,
          },
        },
      ])
    }

    socket.on("SocketUserEnterEvent", SocketUserEnterEventHandler)
    socket.on("SocketUserLeaveEvent", SocketUserLeaveEventHandler)
    socket.on("SocketPartyCreateEvent", SocketPartyCreateEventHandler)
    return () => {
      socket.off("SocketUserEnterEvent", SocketUserEnterEventHandler)
      socket.off("SocketUserLeaveEvent", SocketUserLeaveEventHandler)
      socket.off("SocketPartyCreateEvent", SocketPartyCreateEventHandler)
    }
  }, [members, chatEvents, leaderId])

  useEffect(() => {
    const SocketPartyDestroyEventHandler = (_: SocketPartyDestroyEvent) => {
      setGameDestroyed(true)
    }
    socket.on("SocketPartyDestroyEvent", SocketPartyDestroyEventHandler)
    return () => {
      socket.off("SocketPartyDestroyEvent", SocketPartyDestroyEventHandler)
    }
  }, [])

  if (gameDestroyed) return <div>Game destroyed</div>

  return (
    <div className="ml-20">
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
      <DrawingCanvas />
      <div>
        Chat:
        <ChatMessages chatEvents={chatEvents} />
        <input className="border" type="text" ref={chatBoxRef} />
        <button
          onClick={() => {
            async function _() {
              if (chatBoxRef.current?.value) {
                const message = chatBoxRef.current?.value
                chatBoxRef.current.value = ""
                const event: SocketChatEvent = {
                  userId: user.id,
                  name: user.name ?? "",
                  image: user.image ?? null,
                  message: message,
                }
                socket.emit("SocketChatEvent", event)
                console.log("emited as socket", socket.id)
              }
            }
            void _()
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
        {message.event.name}: {message.event.message}
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
