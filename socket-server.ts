import { env } from "@/env"
import { getLeaderId } from "@/server/actions/getLeaderId"
import { db } from "@/server/db"
import { sleep } from "@/server/utils"
import { type Word, getRandomWords } from "@/server/words"
import type {
  SocketAddCustomWordEvent,
  SocketAddPointsEvent,
  SocketChangeGameStateEvent,
  SocketChangeTeamEvent,
  SocketChatEvent,
  SocketDrawEvent,
  SocketFinishDrawingEvent,
  SocketGuessEvent,
  SocketPartyCreateEvent,
  SocketPartyDestroyEvent,
  SocketStartDrawingEvent,
  SocketStartGameEvent,
  SocketSubmitCustomWordEvent,
  SocketUserEnterEvent,
  SocketUserVoteWordEvent,
  SocketVoteWordEvent,
} from "@/types"
import { Server } from "socket.io"
import { z } from "zod"

const io = new Server({
  cors: {
    origin: env.NEXTAUTH_URL,
  },
})

type EventPayload =
  | { type: "SocketIdentifyAck" }
  | { type: "SocketPartyCreateEvent"; event: SocketPartyCreateEvent }
  | { type: "SocketPartyDestroyEvent"; event: SocketPartyDestroyEvent }
  | { type: "SocketUserEnterEvent"; event: SocketUserEnterEvent }
  | { type: "SocketUserLeaveEvent"; event: SocketUserEnterEvent }
  | { type: "SocketChatEvent"; event: SocketChatEvent }
  | { type: "SocketChangeTeamEvent"; event: SocketChangeTeamEvent }
  | { type: "SocketChangeGameStateEvent"; event: SocketChangeGameStateEvent }
  | { type: "SocketUserStartDrawing" }
  | { type: "SocketUserStopDrawing" }
  | { type: "SocketStartDrawing"; event: SocketStartDrawingEvent }
  | { type: "SocketDraw"; event: SocketDrawEvent }
  | { type: "SocketFinishDrawing"; event: SocketFinishDrawingEvent }
  | { type: "SocketVoteWord"; event: SocketVoteWordEvent }
  | { type: "SocketAddCustomWord"; event: SocketAddCustomWordEvent }
  | { type: "SocketAddPointsEvent"; event: SocketAddPointsEvent }

function ioSend(room: string, payload: EventPayload) {
  if ("event" in payload) {
    io.to(room).emit(payload.type, payload.event)
  } else {
    io.to(room).emit(payload.type)
  }
}

const userPartyMap = new Map<string, string>()
const socketUserMap = new Map<string, string>()

type Party = {
  leaderId: string
  teams: { red: Set<string>; blue: Set<string> }
  scores: { red: number; blue: number }
  round: number
  half: "FIRST" | "SECOND"
  drawingTeam: "red" | "blue" | null
  drawingUserId: string | null
  currentWord: Word | null
  rounds: number
  timeToGuess: number
  category: "Gaming" | "Technology"
  wordChoices: number
  wordVotes: Map<Word, Set<string>>
  startingCredits: number
}

const partyMap = new Map<string, Party>()

const getParty = async (partyId: string) => {
  if (partyMap.has(partyId)) return partyMap.get(partyId)!

  const dbParty = await db.party.findUnique({
    where: {
      id: partyId,
    },
  })

  if (!dbParty) return null

  const party: Party = {
    leaderId: dbParty.leaderId,
    teams: {
      red: new Set<string>(),
      blue: new Set<string>(),
    },
    scores: {
      red: 0,
      blue: 0,
    },
    round: 0,
    half: "FIRST" as const,
    drawingTeam: null,
    drawingUserId: null,
    currentWord: null,
    rounds: 3,
    timeToGuess: 10000,
    category: "Gaming" as const,
    wordChoices: 3,
    wordVotes: new Map<Word, Set<string>>(),
    startingCredits: 1000,
  }

  partyMap.set(partyId, party)

  return party
}

const getUserAndParty = (socketId: string) => {
  const userId = socketUserMap.get(socketId)
  let partyId = undefined
  if (userId) partyId = userPartyMap.get(userId)
  return {
    userId,
    partyId,
  }
}

io.on("connection", (socket) => {
  console.log("connected", socket.id)

  // Triggered when the Socket Id changes for whatever reason (page reload, etc.)
  socket.on("SocketIdentify", async (userId: string) => {
    socketUserMap.set(socket.id, userId)
    ioSend(socket.id, { type: "SocketIdentifyAck" })
    console.log(socket.id, "identified as", userId)
  })

  // Triggered when the user joins a party (loads the /game/[partyId] page)
  socket.on("SocketJoinParty", async (partyId: string) => {
    console.log("SocketJoinParty")
    const userId = socketUserMap.get(socket.id)
    if (!userId) return

    const party = await db.party.findUnique({
      where: {
        id: partyId,
      },
    })

    if (!party) {
      console.log(userId, "tried to join a party that doesn't exist")
      return
    }

    userPartyMap.set(userId, party.id)
    await socket.join(party.id)
    console.log(userId, "joined", party.id)

    const events = await db.event.findMany({
      where: {
        partyId: partyId,
      },
      include: {
        ChatEvent: {
          include: {
            user: true,
          },
        },
        UserEnterEvent: {
          include: {
            user: true,
          },
        },
        UserLeaveEvent: {
          include: {
            user: true,
          },
        },
        PartyLeaderChangeEvent: {
          include: {
            user: true,
          },
        },
        PartyCreateEvent: {
          include: {
            User: true,
          },
        },
        PartyDestroyEvent: {
          include: {
            User: true,
          },
        },
        ChangeTeamEvent: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })

    for (const event of events) {
      if (event.PartyCreateEvent) {
        ioSend(socket.id, {
          type: "SocketPartyCreateEvent",
          event: event.PartyCreateEvent,
        })
      }
      if (event.PartyDestroyEvent) {
        ioSend(socket.id, {
          type: "SocketPartyDestroyEvent",
          event: event.PartyDestroyEvent,
        })
      }
      if (event.UserEnterEvent) {
        ioSend(socket.id, {
          type: "SocketUserEnterEvent",
          event: event.UserEnterEvent,
        })
      }
      if (event.UserLeaveEvent) {
        ioSend(socket.id, {
          type: "SocketUserLeaveEvent",
          event: event.UserLeaveEvent,
        })
      }
      if (event.ChatEvent) {
        ioSend(socket.id, {
          type: "SocketChatEvent",
          event: {
            userId: event.ChatEvent.userId,
            name: event.ChatEvent.user.name ?? "",
            image: event.ChatEvent.user.image,
            message: event.ChatEvent.message,
          },
        })
      }

      if (event.ChangeTeamEvent) {
        ioSend(socket.id, {
          type: "SocketChangeTeamEvent",
          event: {
            user: {
              id: event.ChangeTeamEvent.userId,
              name: event.ChangeTeamEvent.user.name ?? "",
              image: event.ChangeTeamEvent.user.image,
            },
            team: event.ChangeTeamEvent.team,
          },
        })
      }
    }
  })

  // Triggered when user sends a chat message.
  socket.on("SocketChatEvent", async (event: SocketChatEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) {
      console.log("SocketChatEvent: no user id")
      return
    }
    const partyId = userPartyMap.get(userId)
    if (!partyId) {
      console.log("SocketChatEvent: no party id")
      return
    }
    console.log("SocketChatEvent", userId, partyId)
    console.log(socket.rooms)

    ioSend(partyId, { type: "SocketChatEvent", event })

    await db.event.create({
      data: {
        partyId: partyId,
        ChatEvent: {
          create: {
            userId: userId,
            message: event.message,
          },
        },
      },
    })

    console.log("SocketChatEvent: created event")
  })

  // Triggered when user changes the team.
  socket.on("SocketChangeTeamEvent", async (event: SocketChangeTeamEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    const party = await getParty(partyId)
    if (!party) return

    if (event.team === "red") {
      party.teams.blue.delete(userId)
      party.teams.red.add(userId)
    } else if (event.team === "blue") {
      party.teams.red.delete(userId)
      party.teams.blue.add(userId)
    }

    partyMap.set(partyId, party)

    ioSend(partyId, { type: "SocketChangeTeamEvent", event })
    await db.event.create({
      data: {
        partyId: partyId,
        ChangeTeamEvent: {
          create: {
            userId: userId,
            team: event.team,
          },
        },
      },
    })

    console.log("SocketChangeTeamEvent")
  })

  const SocketRoundChangeEvent = async (partyId: string) => {
    let party = partyMap.get(partyId)!
    if (!party) return

    if (party.round == 0) {
      party.round = 1
      party.drawingTeam = Math.random() > 0.5 ? "red" : "blue"
      party.half = "FIRST"
    } else {
      if (party.half == "FIRST") {
        party.half = "SECOND"
      } else {
        party.half = "FIRST"
        party.round++
      }
      party.drawingTeam = party.drawingTeam === "red" ? "blue" : "red"
    }

    if (party.round >= party.rounds) {
      await db.party.update({
        where: {
          id: partyId,
        },
        data: {
          active: false,
          Events: {
            create: {
              PartyDestroyEvent: {
                create: {
                  userId: null,
                },
              },
            },
          },
        },
      })
      ioSend(partyId, {
        type: "SocketChangeGameStateEvent",
        event: {
          state: "GAME_OVER",
        },
      })
      return
    }

    if (party.drawingTeam === "red") {
      party.drawingUserId = Array.from(party.teams.red).sort()[
        party.round % party.teams.red.size
      ]!
    } else {
      party.drawingUserId = Array.from(party.teams.blue).sort()[
        party.round % party.teams.blue.size
      ]!
    }

    party.wordVotes.clear()

    const words = getRandomWords(party.category, party.wordChoices)

    words.forEach((word) => {
      party.wordVotes.set(word, new Set())
    })

    const half = party.half
    const round = party.round

    partyMap.set(partyId, party)

    ioSend(partyId, {
      type: "SocketChangeGameStateEvent",
      event: {
        state: "ROUND_CHANGE",
        round: party.round,
        rounds: party.rounds,
        drawingTeam: party.drawingTeam,
        drawingUserId: party.drawingUserId,
        words: words,
      },
    })

    await sleep(15000)

    party = partyMap.get(partyId)!

    const word = Array.from(party.wordVotes.entries()).sort(
      (a, b) => b[1].size - a[1].size,
    )[0]![0]

    party.currentWord = word

    ioSend(partyId, {
      type: "SocketChangeGameStateEvent",
      event: {
        state: "DRAWING",
        word: party.currentWord,
        timeToGuess: party.timeToGuess,
      },
    })

    Array.from(socketUserMap.entries())
      .filter((entry) => entry[1] === party.drawingUserId)
      .map((entry) => entry[0])
      .forEach((socketId) => {
        console.log("start drawing", socketId)
        ioSend(socketId, { type: "SocketUserStartDrawing" })
      })

    await sleep(party.timeToGuess)

    party = partyMap.get(partyId)!
    if (party.round === round && party.half === half) {
      Array.from(socketUserMap.entries())
        .filter((entry) => entry[1] === party.drawingUserId)
        .map((entry) => entry[0])
        .forEach((socketId) => {
          console.log("start drawing", socketId)
          ioSend(socketId, { type: "SocketUserStopDrawing" })
        })
      ioSend(partyId, {
        type: "SocketChangeGameStateEvent",
        event: {
          state: "GUESS_TIMEOUT",
        },
      })
      await sleep(3000)
      await SocketRoundChangeEvent(partyId)
    }
  }

  // Triggered when the party leader starts the game.
  socket.on("SocketStartGameEvent", async (event: SocketStartGameEvent) => {
    const { userId, partyId } = getUserAndParty(socket.id)
    if (!userId || !partyId) return

    const party = await getParty(partyId)
    if (!party) return

    console.log(event)

    // TODO: check socket data

    party.rounds = event.rounds
    party.timeToGuess = event.timeToGuess * 1000
    party.category = z.enum(["Gaming", "Technology"]).parse(event.category)
    party.wordChoices = event.wordChoices
    party.startingCredits = event.startingCredits
    party.scores.blue = event.startingCredits
    party.scores.red = event.startingCredits

    partyMap.set(partyId, party)

    // TODO: check if game hasn't already started
    // TODO: check if user is party leader
    // TODO: check if both teams have at least 1 user

    ioSend(partyId, {
      type: "SocketChangeGameStateEvent",
      event: {
        state: "TOSS",
        startingCredits: event.startingCredits,
        allowCustomWord: event.allowCustomWord,
      },
    })

    await sleep(5000)

    await SocketRoundChangeEvent(partyId)
  })

  // Triggered when user sends a chat message when their team is the guessing team.
  // TODO: remove this. use the SocketChatEvent.
  socket.on("SocketGuess", async (event: SocketGuessEvent) => {
    console.log("aa")
    const { userId, partyId } = getUserAndParty(socket.id)
    if (!userId || !partyId) return

    const party = await getParty(partyId)
    if (!party) return
    if (!party.currentWord) return
    if (party.drawingTeam === "red" && !party.teams.red.has(userId)) return
    if (party.drawingTeam === "blue" && !party.teams.blue.has(userId)) return
    console.log("bb")

    if (event.guess.toLowerCase() == party.currentWord.word.toLowerCase()) {
      console.log("cc")
      ioSend(partyId, {
        type: "SocketChangeGameStateEvent",
        event: {
          state: "GUESS_CORRECT",
          guesserId: userId,
        },
      })

      ioSend(partyId, {
        type: "SocketAddPointsEvent",
        event: {
          team: party.teams.red.has(userId) ? "red" : "blue",
          userId: userId,
          points: party.currentWord.points,
        },
      })

      ioSend(partyId, {
        type: "SocketAddPointsEvent",
        event: {
          team: party.drawingTeam === "red" ? "blue" : "red",
          points: -party.currentWord.points,
          userId: null,
        },
      })
      await sleep(3000)
      await SocketRoundChangeEvent(partyId)
    }
  })

  // Triggered when user votes for a word.
  socket.on("SocketUserVoteWord", async (event: SocketUserVoteWordEvent) => {
    const { userId, partyId } = getUserAndParty(socket.id)
    if (!userId || !partyId) return

    const party = await getParty(partyId)
    if (!party) return

    console.log("voting")

    party.wordVotes.forEach((votes, word) => {
      if (votes.has(userId)) votes.delete(userId)
    })

    if (!party.wordVotes.has(event.word))
      party.wordVotes.set(event.word, new Set([userId]))
    else party.wordVotes.get(event.word)!.add(userId)

    ioSend(partyId, {
      type: "SocketVoteWord",
      event: {
        userId: userId,
        word: event.word,
      },
    })
  })

  // Triggered when user submits a custom word.
  socket.on(
    "SocketSubmitCustomWord",
    async (event: SocketSubmitCustomWordEvent) => {
      const { userId, partyId } = getUserAndParty(socket.id)
      if (!userId || !partyId) return
      const party = await getParty(partyId)
      if (!party) return

      const word = { word: event.word, points: 1000, userId: userId }
      party.wordVotes.set(word, new Set([userId]))

      ioSend(partyId, {
        type: "SocketAddCustomWord",
        event: {
          word: word,
        },
      })
    },
  )

  // These events are triggered by the canvas.
  // If you have an issue, it's probably not here.

  socket.on("SocketStartDrawing", (event: SocketStartDrawingEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    ioSend(partyId, { type: "SocketStartDrawing", event })
  })

  socket.on("SocketDraw", (event: SocketDrawEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    ioSend(partyId, { type: "SocketDraw", event })
  })

  socket.on("SocketFinishDrawing", (event: SocketFinishDrawingEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    ioSend(partyId, { type: "SocketFinishDrawing", event })
  })
})

console.log("Listening on port 3001")
io.listen(env.SOCKET_PORT)
