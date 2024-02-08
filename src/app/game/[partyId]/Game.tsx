"use client"

import type {
  SocketChangeGameStateEvent,
  ChatMessage,
  SimpleUser,
  SocketChangeTeamEvent,
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
import { ChangeAfterSomeTime } from "@/components/ShowAfterSomeTime"

export function Game({ partyId, user }: { partyId: string; user: User }) {
  const [members, setMembers] = useState<Prisma.UserGetPayload<object>[]>([])
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const [gameDestroyed, setGameDestroyed] = useState(false)

  const chatBoxRef = useRef<HTMLInputElement | null>(null)

  const [teams, setTeams] = useState<{
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }>({
    red: new Map(),
    blue: new Map(),
  })

  const [gameStateEvent, setGameStateEvent] =
    useState<SocketChangeGameStateEvent>({ state: "LOBBY" })

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
      setChatMessages([
        ...chatMessages,
        {
          createdAt: new Date(),
          event: {
            type: "ChatEvent",
            ...event,
          },
        },
      ])
      console.log(chatMessages)
    }
    socket.on("SocketChatEvent", SocketChatEventHandler)
    return () => {
      socket.off("SocketChatEvent", SocketChatEventHandler)
    }
  }, [chatMessages])

  useEffect(() => {
    const SocketUserEnterEventHandler = (event: SocketUserEnterEvent) => {
      if (!members.find((member) => member.id === event.userId)) {
        setMembers([...members, event.user])
        setChatMessages([
          ...chatMessages,
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
      setChatMessages([
        ...chatMessages,
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
      if (!members.find((member) => member.id === event.userId))
        setMembers([...members, event.User])
      setLeaderId(event.userId)
      setChatMessages([
        ...chatMessages,
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
  }, [members, chatMessages, leaderId])

  useEffect(() => {
    const SocketPartyDestroyEventHandler = (_: SocketPartyDestroyEvent) => {
      setGameDestroyed(true)
    }
    socket.on("SocketPartyDestroyEvent", SocketPartyDestroyEventHandler)
    return () => {
      socket.off("SocketPartyDestroyEvent", SocketPartyDestroyEventHandler)
    }
  }, [])

  useEffect(() => {
    const SocketChangeTeamHandler = (event: SocketChangeTeamEvent) => {
      const _teams = { ...teams }
      let teamChanged = false
      if (event.team === "red") {
        _teams.blue.delete(event.user.id)
        if (!_teams.red.has(event.user.id)) {
          teamChanged = true
          _teams.red.set(event.user.id, event.user)
        }
      } else if (event.team === "blue") {
        _teams.red.delete(event.user.id)
        if (!_teams.blue.has(event.user.id)) {
          teamChanged = true
          _teams.blue.set(event.user.id, event.user)
        }
      }
      if (teamChanged) {
        setChatMessages([
          ...chatMessages,
          {
            createdAt: new Date(),
            event: {
              type: "ChangeTeamEvent",
              ...event,
            },
          },
        ])
      }
      setTeams(_teams)
    }

    socket.on("SocketChangeTeamEvent", SocketChangeTeamHandler)

    return () => {
      socket.off("SocketChangeTeamEvent", SocketChangeTeamHandler)
    }
  }, [teams, chatMessages])

  useEffect(() => {
    const SocketChangeGameStateHandler = (
      event: SocketChangeGameStateEvent,
    ) => {
      setGameStateEvent(event)
    }
    socket.on("SocketChangeGameStateEvent", SocketChangeGameStateHandler)
    return () => {
      socket.off("SocketChangeGameStateEvent", SocketChangeGameStateHandler)
    }
  })

  const [prevRound, setPrevRound] = useState(0)

  if (gameDestroyed) return <div>Game destroyed</div>

  return (
    <div className="flex h-full w-full flex-col items-center border">
      <div>Party {partyId}</div>
      <div>
        {user.id === leaderId ? "You are the leader" : "You are a member"}
      </div>
      <div>Round X of Y</div>
      <div className="flex h-[500px] w-[1000px] border">
        <div className="flex w-[200px] flex-col items-center">
          <div className="h-1/2">
            <div className="font-bold">TEAM RED</div>
            <TeamMembers team={teams.red} />
          </div>
          <div className="h-1/2">
            <div className="font-bold">TEAM BLUE</div>
            <TeamMembers team={teams.blue} />
          </div>
        </div>
        <div className="flex-grow border">
          <CenterBoard
            gameStateEvent={gameStateEvent}
            user={user}
            prevRound={prevRound}
            teams={teams}
          />
        </div>
        <ChatBox
          chatMessages={chatMessages}
          chatBoxRef={chatBoxRef}
          user={user}
        />
        <div className="flex flex-col items-center"></div>
      </div>
      <div>
        {leaderId === user.id && gameStateEvent.state === "LOBBY" ? (
          <>
            <button
              onClick={() => socket.emit("SocketStartGameEvent")}
              className="border bg-green-300"
            >
              Start Game
            </button>
            <Link href="/destroy">Destroy Party</Link>
          </>
        ) : null}
      </div>
    </div>
  )
}

function CenterBoard({
  gameStateEvent,
  user,
  prevRound,
  teams,
}: {
  gameStateEvent: SocketChangeGameStateEvent
  user: User
  prevRound: number
  teams: {
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }
}) {
  if (gameStateEvent.state === "LOBBY") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <JoinRedTeamButton user={user} />
        <JoinBlueTeamButton user={user} />
      </div>
    )
  }

  if (gameStateEvent.state === "TOSS") {
    return (
      <div className="flex h-full w-full items-center justify-center">TOSS</div>
    )
  }

  if (gameStateEvent.state === "ROUND_CHANGE") {
    let user: SimpleUser
    if (gameStateEvent.drawingTeam === "blue")
      user = teams.blue.get(gameStateEvent.drawingUserId)!
    else user = teams.red.get(gameStateEvent.drawingUserId)!
    const team = gameStateEvent.drawingTeam === "red" ? "Red" : "Blue"
    if (gameStateEvent.round === prevRound) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div>Drawing from Red Team</div>
          <ChangeAfterSomeTime
            ms={2000}
            before={null}
            after={<div>{JSON.stringify(user)}</div>}
          />
        </div>
      )
    } else {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
          <ChangeAfterSomeTime
            ms={2000}
            before={<div>Round {gameStateEvent.round}</div>}
            after={
              <>
                <div>Drawing from {team} Team</div>
                <ChangeAfterSomeTime
                  ms={2000}
                  before={null}
                  after={<div>{user ? user.name : null}</div>}
                />
              </>
            }
          />
        </div>
      )
    }
  }

  return <DrawingCanvas />
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

  if (message.event.type === "ChangeTeamEvent") {
    return (
      <div>
        {message.event.user.name} joined the {message.event.team} team.
      </div>
    )
  }

  return null
}

function TeamMembers({ team }: { team: Map<string, SimpleUser> }) {
  return (
    <div className="flex flex-col items-center">
      {Array.from(team.values()).map((user, idx) => (
        <div key={idx}>{user.name}</div>
      ))}
    </div>
  )
}

function ChatBox({
  chatMessages,
  chatBoxRef,
  user,
}: {
  chatMessages: ChatMessage[]
  chatBoxRef: React.MutableRefObject<HTMLInputElement | null>
  user: User
}) {
  return (
    <div className="flex flex-shrink flex-col border p-2">
      <div className="w-full p-2  text-center font-bold">CHAT</div>
      <div className="flex-grow overflow-auto">
        {chatMessages.map((event, idx) => (
          <div key={idx}>
            <Message message={event} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="border" type="text" ref={chatBoxRef} />
        <button
          className="bg-red-200"
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
                console.log("emitted as socket", socket.id)
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

function JoinRedTeamButton({ user }: { user: User }) {
  return (
    <button
      onClick={() => {
        const event: SocketChangeTeamEvent = {
          team: "red",
          user: {
            id: user.id,
            name: user.name ?? "",
            image: user.image ?? null,
          },
        }
        socket.emit("SocketChangeTeamEvent", event)
      }}
      className="border bg-red-300"
    >
      Join Red Team
    </button>
  )
}

function JoinBlueTeamButton({ user }: { user: User }) {
  return (
    <button
      onClick={() => {
        const event: SocketChangeTeamEvent = {
          team: "blue",
          user: {
            id: user.id,
            name: user.name ?? "",
            image: user.image ?? null,
          },
        }
        socket.emit("SocketChangeTeamEvent", event)
      }}
      className="border bg-blue-300"
    >
      Join Blue Team
    </button>
  )
}
