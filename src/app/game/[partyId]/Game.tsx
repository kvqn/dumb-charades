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
import { twMerge } from "tailwind-merge"

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

  const [isLeader, setIsLeader] = useState(false)

  useEffect(() => {
    setIsLeader(user.id === leaderId)
  }, [user.id, leaderId])

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
    <div className="flex flex-grow flex-col items-center justify-center">
      <div>Party {partyId}</div>
      {isLeader ? <div className="text-2xl">You are the leader</div> : null}
      <div>Round X of Y</div>
      <div
        id="board"
        className="flex h-[500px] overflow-hidden rounded-xl border-4 border-black"
      >
        <div className="flex w-[200px] flex-col items-center">
          <LeftBoard
            teams={teams}
            drawingUserId={
              gameStateEvent.state === "ROUND_CHANGE"
                ? gameStateEvent.drawingUserId
                : undefined
            }
          />
        </div>
        <div className="h-[500px] w-[700px] flex-grow border-x-4 border-black bg-white">
          <CenterBoard
            gameStateEvent={gameStateEvent}
            user={user}
            prevRound={prevRound}
            teams={teams}
            isLeader={isLeader}
          />
        </div>
        <ChatBox
          chatMessages={chatMessages}
          chatBoxRef={chatBoxRef}
          user={user}
        />
        <div className="flex flex-col items-center"></div>
      </div>
    </div>
  )
}

function LeftBoard({
  teams,
  drawingUserId,
}: {
  teams: { red: Map<string, SimpleUser>; blue: Map<string, SimpleUser> }
  drawingUserId?: string
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-lime-50 p-4">
      <div className="flex h-1/2 w-full flex-col rounded-xl border-4 border-black bg-red-300">
        <div className="p-2 text-center font-bold">TEAM RED</div>
        <div className="flex flex-col items-center">
          {Array.from(teams.red.values()).map((user, idx) => (
            <div key={idx} className="flex gap-2">
              <div>{user.name}</div>
              {drawingUserId === user.id ? <div>(drawing)</div> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-1/2 w-full flex-col rounded-xl border-4 border-black bg-blue-300">
        <div className="p-2 text-center font-bold">TEAM BLUE</div>
        <div className="flex flex-col items-center">
          {Array.from(teams.blue.values()).map((user, idx) => (
            <div key={idx} className="flex">
              <div>{user.name}</div>
              {drawingUserId === user.id ? <div>(drawing)</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CenterBoard({
  gameStateEvent,
  user,
  prevRound,
  teams,
  isLeader,
}: {
  gameStateEvent: SocketChangeGameStateEvent
  user: User
  prevRound: number
  teams: {
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }
  isLeader: boolean
}) {
  if (gameStateEvent.state === "LOBBY") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between p-20">
        <div className="flex gap-4">
          <JoinTeamButton team="red" user={user} />
          <JoinTeamButton team="blue" user={user} />
        </div>
        {isLeader ? (
          <div className="flex max-h-[50%] w-full flex-grow flex-col items-center">
            <div className="py-4 text-xl">Party Options</div>
            <div className="flex gap-2">
              <button
                onClick={() => socket.emit("SocketStartGameEvent")}
                className="rounded-2xl border-2 border-black bg-green-300 px-4 py-2 hover:border-green-800 hover:bg-green-400"
              >
                Start Game
              </button>
              <Link
                className="rounded-2xl border-2 border-black bg-red-300 px-4 py-2 hover:border-red-800 hover:bg-red-400"
                href="/destroy"
              >
                Destroy Party
              </Link>
            </div>
          </div>
        ) : null}
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
        <ChangeAfterSomeTime
          ms={4000}
          before={
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div>Drawing from Red Team</div>
              <ChangeAfterSomeTime
                ms={2000}
                before={null}
                after={<div>{JSON.stringify(user)}</div>}
              />
            </div>
          }
          after={<DrawingCanvas />}
        />
      )
    } else {
      return (
        <ChangeAfterSomeTime
          ms={6000}
          before={
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
          }
          after={<DrawingCanvas />}
        />
      )
    }
  }

  if (gameStateEvent.state === "GAME_OVER") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        GAME OVER
      </div>
    )
  }

  if (gameStateEvent.state === "GUESS_TIMEOUT") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        GUESS TIMEOUT
      </div>
    )
  }
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
    <div className="flex flex-shrink flex-col bg-yellow-50 p-2">
      <div className="w-full p-2 text-center font-bold">CHAT</div>
      <div className="flex-grow overflow-auto">
        {chatMessages.map((event, idx) => (
          <div key={idx}>
            <Message message={event} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-black px-2 py-1"
          type="text"
          ref={chatBoxRef}
          onKeyDown={(event) => {
            if (event.key != "Enter") return
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
        />
      </div>
    </div>
  )
}

function JoinTeamButton({ team, user }: { team: "red" | "blue"; user: User }) {
  return (
    <button
      onClick={() => {
        const event: SocketChangeTeamEvent = {
          team: team,
          user: {
            id: user.id,
            name: user.name ?? "",
            image: user.image ?? null,
          },
        }
        socket.emit("SocketChangeTeamEvent", event)
      }}
      className={twMerge(
        "rounded-2xl border-2 border-black px-4 py-2",
        team === "red" && "bg-red-300 hover:border-red-800 hover:bg-red-400",
        team === "blue" &&
          "bg-blue-300 hover:border-blue-800 hover:bg-blue-400",
      )}
    >
      Join Red Team
    </button>
  )
}
