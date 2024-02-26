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
  SocketStartGameEvent,
  SocketVoteWordEvent,
  SocketUserVoteWordEvent,
  SocketGuessEvent,
  SocketAddPointsEvent,
} from "@/types"
import { type Prisma } from "@prisma/client"
import { type User } from "next-auth"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { socket } from "@/client/socket"
import { DrawingCanvas } from "./DrawingCanvas"
import { ChangeAfterSomeTime } from "@/components/ShowAfterSomeTime"
import { twMerge } from "tailwind-merge"
import { type Word } from "@/server/words"
import { UserImage } from "@/components/UserImage"
import { titleCase } from "@/client/utils"
import { Coin } from "@/components/Coin"
import Head from "next/head"
import { AlternatingImage } from "@/components/AlternatingImage"

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
  const [drawingUserId, setDrawingUserId] = useState<string | undefined>(
    undefined,
  )
  const [drawingTeam, setDrawingTeam] = useState<"red" | "blue" | undefined>(
    undefined,
  )

  const [rounds, setRounds] = useState<number | undefined>(undefined)

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

  const [round, setRound] = useState(0)

  useEffect(() => {
    const SocketChangeGameStateHandler = (
      event: SocketChangeGameStateEvent,
    ) => {
      if (event.state === "ROUND_CHANGE") {
        setDrawingUserId(event.drawingUserId)
        setDrawingTeam(event.drawingTeam)
        setRounds(event.rounds)
        setRound(event.round)
      } else if (event.state != "DRAWING") {
        setDrawingUserId(undefined)
        setDrawingTeam(undefined)
      }
      setGameStateEvent(event)
    }
    socket.on("SocketChangeGameStateEvent", SocketChangeGameStateHandler)
    return () => {
      socket.off("SocketChangeGameStateEvent", SocketChangeGameStateHandler)
    }
  }, [gameStateEvent, drawingUserId, drawingTeam, teams])

  if (gameDestroyed) return <div>Game destroyed</div>

  return (
    <div className="flex flex-grow select-none flex-col items-center justify-center text-black">
      <div>Party {partyId}</div>
      {isLeader ? <div className="text-2xl">You are the leader</div> : null}
      {round && rounds ? (
        <div>
          Round {round} of {rounds}
        </div>
      ) : null}
      <div
        id="board"
        className="flex h-[500px] overflow-hidden rounded-xl border-4 border-black"
      >
        <div className="flex w-[200px] flex-col items-center">
          <LeftBoard
            teams={teams}
            drawingUserId={drawingUserId}
            isLobby={gameStateEvent.state === "LOBBY"}
          />
        </div>
        <div className="h-[500px] w-[700px] flex-grow border-x-4 border-black bg-white">
          <CenterBoard
            gameStateEvent={gameStateEvent}
            user={user}
            teams={teams}
            isLeader={isLeader}
            drawingUserId={drawingUserId}
            drawingTeam={drawingTeam}
          />
        </div>
        <ChatBox
          chatMessages={chatMessages}
          chatBoxRef={chatBoxRef}
          user={user}
          teams={teams}
        />
        <div className="flex flex-col items-center"></div>
      </div>
    </div>
  )
}

function LeftBoard({
  teams,
  drawingUserId,
  isLobby,
}: {
  teams: { red: Map<string, SimpleUser>; blue: Map<string, SimpleUser> }
  drawingUserId?: string
  isLobby: boolean
}) {
  const [teamPoints, setTeamPoints] = useState({ red: 0, blue: 0 })

  useEffect(() => {
    const SocketAddPointsHandler = (event: SocketAddPointsEvent) => {
      const newTeamPoints = teamPoints
      if (event.team === "red") {
        newTeamPoints.red += event.points
      } else {
        newTeamPoints.blue += event.points
      }
      setTeamPoints(newTeamPoints)
    }
    socket.on("SocketAddPointsEvent", SocketAddPointsHandler)
    return () => {
      socket.off("SocketAddPointsEvent", SocketAddPointsHandler)
    }
  }, [teamPoints])

  console.log(teams)
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-lime-50 p-4">
      <div className="flex h-1/2 w-full flex-col rounded-xl border-4 border-black bg-red-300">
        <div className="pt-2 text-center font-bold">TEAM RED</div>
        {isLobby ? null : (
          <div className="flex w-full justify-center gap-1 text-xs">
            {teamPoints.red}
            <Coin width={15} height={15} />
          </div>
        )}
        <div className="flex flex-col items-center">
          {Array.from(teams.red.values()).map((user, idx) => (
            <div key={idx} className="flex w-full justify-center gap-2 px-2">
              {drawingUserId === user.id ? (
                <AlternatingImage
                  src1="/static/images/pencil-1.png"
                  src2="/static/images/pencil-2.png"
                  width={20}
                  height={20}
                />
              ) : null}
              <UserImage src={user.image} />
              <div className="overflow-hidden text-ellipsis text-nowrap">
                {user.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-1/2 w-full flex-col rounded-xl border-4 border-black bg-blue-300">
        <div className="pt-2 text-center font-bold">TEAM BLUE</div>
        {isLobby ? null : (
          <div className="flex w-full justify-center gap-1 text-xs">
            {teamPoints.blue}
            <Coin width={15} height={15} />
          </div>
        )}
        <div className="flex flex-col items-center overflow-hidden">
          {Array.from(teams.blue.values()).map((user, idx) => (
            <div key={idx} className="flex w-full justify-center gap-2 px-2">
              {drawingUserId === user.id ? (
                <AlternatingImage
                  src1="/static/images/pencil-1.png"
                  src2="/static/images/pencil-2.png"
                  width={20}
                  height={20}
                />
              ) : null}
              <UserImage src={user.image} />
              <div className="overflow-hidden text-ellipsis text-nowrap">
                {user.name}
              </div>
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
  teams,
  isLeader,
  drawingUserId,
  drawingTeam,
}: {
  gameStateEvent: SocketChangeGameStateEvent
  user: User
  teams: {
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }
  isLeader: boolean
  drawingUserId?: string
  drawingTeam?: "red" | "blue"
}) {
  let rounds = 3
  let timeToGuess = 30
  let category = "Gaming"
  let choices = 3

  const userTeam = teams.red.has(user.id) ? "red" : "blue"

  const [isUserDrawing, setIsUserDrawing] = useState(false)

  useEffect(() => {
    const SocketUserStartDrawingHandler = () => {
      console.log("my turn to draw")
      setIsUserDrawing(true)
    }
    const SocketUserStopDrawingHandler = () => {
      setIsUserDrawing(false)
    }
    socket.on("SocketUserStartDrawing", SocketUserStartDrawingHandler)
    socket.on("SocketUserStopDrawing", SocketUserStopDrawingHandler)
    return () => {
      socket.off("SocketUserStartDrawing", SocketUserStartDrawingHandler)
      socket.off("SocketUserStopDrawing", SocketUserStopDrawingHandler)
    }
  }, [])

  if (gameStateEvent.state === "LOBBY") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between p-4">
        <div className="flex flex-grow flex-col items-center justify-center gap-4 p-16">
          <JoinTeamButton team="red" user={user} />
          <JoinTeamButton team="blue" user={user} />
        </div>
        {isLeader ? (
          <div className="mx-4 flex max-h-[50%] w-full flex-grow flex-col items-center justify-center gap-2 rounded-xl border-2 border-black bg-rose-50 text-lg">
            <div className="text-2xl font-bold">Party Options</div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <div className="flex items-center gap-4">
                Rounds :
                <select
                  className="rounded-xl border-2 border-black px-2 py-1"
                  onChange={(e) => {
                    rounds = parseInt(e.target.value)
                  }}
                >
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                  <option>6</option>
                  <option>7</option>
                  <option>8</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                Time to Guess (sec):
                <select
                  className="rounded-xl border-2 border-black px-2 py-1"
                  onChange={(e) => {
                    timeToGuess = parseInt(e.target.value)
                  }}
                >
                  <option>30</option>
                  <option>45</option>
                  <option>60</option>
                  <option>75</option>
                  <option>90</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                Category :
                <select
                  className="rounded-xl border-2 border-black px-2 py-1"
                  onChange={(e) => {
                    category = e.target.value
                  }}
                >
                  <option>Gaming</option>
                  <option>Technology</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                Choices :
                <select
                  className="rounded-xl border-2 border-black px-2 py-1"
                  onChange={(e) => {
                    choices = parseInt(e.target.value)
                  }}
                >
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const event: SocketStartGameEvent = {
                    rounds: rounds,
                    timeToGuess: timeToGuess,
                    category: category,
                    wordChoices: choices,
                  }
                  socket.emit("SocketStartGameEvent", event)
                }}
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
    return (
      <ChangeAfterSomeTime
        ms={4000}
        before={
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div>Drawing from Red Team</div>
            <ChangeAfterSomeTime
              ms={2000}
              before={null}
              after={
                <div className="flex gap-2">
                  <UserImage src={user.image} /> {user.name}
                </div>
              }
            />
          </div>
        }
        after={
          <Voting
            teams={teams}
            words={gameStateEvent.words}
            isVoting={userTeam != gameStateEvent.drawingTeam}
            userTeam={userTeam}
          />
        }
      />
    )
  }

  if (gameStateEvent.state === "DRAWING") {
    return (
      <DrawingCanvas
        word={gameStateEvent.word}
        isUserDrawing={isUserDrawing}
        timeToGuess={gameStateEvent.timeToGuess / 1000}
        knowsTheWord={userTeam != drawingTeam}
      />
    )
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

  if (gameStateEvent.state === "GUESS_CORRECT") {
    const guesser = teams.red.has(gameStateEvent.guesserId)
      ? teams.red.get(gameStateEvent.guesserId)
      : teams.blue.get(gameStateEvent.guesserId)
    return (
      <div className="flex h-full w-full items-center justify-center">
        {guesser?.name ?? "???"} has guessed correctly!
      </div>
    )
  }
}

function Message({
  message,
  teams,
}: {
  message: ChatMessage
  teams: {
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }
}) {
  if (message.event.type === "ChatEvent") {
    return (
      <div
        className={twMerge(
          teams.blue.has(message.event.userId) && "text-blue-600",
          teams.red.has(message.event.userId) && "text-red-600",
        )}
      >
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
  teams,
}: {
  chatMessages: ChatMessage[]
  chatBoxRef: React.MutableRefObject<HTMLInputElement | null>
  user: User
  teams: {
    red: Map<string, SimpleUser>
    blue: Map<string, SimpleUser>
  }
}) {
  return (
    <div className="flex flex-shrink flex-col bg-yellow-50 p-2">
      <div className="w-full p-2 text-center font-bold">CHAT</div>
      <div className="flex-grow overflow-auto">
        {chatMessages.map((event, idx) => (
          <div key={idx}>
            <Message message={event} teams={teams} />
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
                const chatEvent: SocketChatEvent = {
                  userId: user.id,
                  name: user.name ?? "",
                  image: user.image ?? null,
                  message: message,
                }
                socket.emit("SocketChatEvent", chatEvent)
                const guessEvent: SocketGuessEvent = {
                  guess: message,
                }
                socket.emit("SocketGuess", guessEvent)
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
      Join {titleCase(team)} Team
    </button>
  )
}

function Voting({
  words,
  isVoting,
  teams,
  userTeam,
}: {
  words: Word[]
  isVoting: boolean
  teams: { red: Map<string, SimpleUser>; blue: Map<string, SimpleUser> }
  userTeam: "red" | "blue"
}) {
  const [_words, setWords] = useState<
    { points: number; word: string; votes: Set<string> }[]
  >(words.map((word) => ({ ...word, votes: new Set<string>() })))
  const [renders, rerender] = useState(0)

  useEffect(() => {
    const SocketVoteWordHandler = (event: SocketVoteWordEvent) => {
      console.log("SocketVoteWord", event)
      const newWords = _words
      newWords.forEach((word) => {
        if (word.votes.has(event.userId)) word.votes.delete(event.userId)
      })
      newWords.forEach((word) => {
        if (word.word === event.word) word.votes.add(event.userId)
      })
      setWords(newWords)
      rerender(renders + 1)
    }
    socket.on("SocketVoteWord", SocketVoteWordHandler)

    return () => {
      socket.off("SocketVoteWord", SocketVoteWordHandler)
    }
  }, [_words, renders])

  if (!isVoting)
    return (
      <div className="flex h-full w-full items-center justify-center text-xl">
        {userTeam === "red" ? "Blue" : "Red"} team is voting
      </div>
    )

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 bg-blue-100">
      <div className="w-full text-center">Voting</div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {_words.map((word, idx) => (
          <div
            key={idx}
            className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-black bg-white px-4 py-2 hover:bg-slate-100"
            onClick={() => {
              const emitEvent: SocketUserVoteWordEvent = {
                word: word.word,
              }
              socket.emit("SocketUserVoteWord", emitEvent)
            }}
          >
            <div>{word.word}</div>
            <div className="flex gap-2 text-xs">
              <div>{word.points}</div>
              <Coin />
            </div>
            <div className="absolute -bottom-2 left-2 flex gap-1">
              {Array.from(word.votes)
                .map((userId) =>
                  teams.red.has(userId)
                    ? teams.red.get(userId)!.image
                    : teams.blue.get(userId)?.image,
                )
                .map((image) => (
                  <UserImage src={image} key={image} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
