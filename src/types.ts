import { type Prisma } from "@prisma/client"
import { type Word } from "./server/words"

export type SocketChatEvent = {
  userId: string
  name: string
  image: string | null
  message: string
}

export type SocketPartyCreateEvent = Prisma.PartyCreateEventGetPayload<{
  include: { User: true }
}>

export type SocketPartyDestroyEvent = Prisma.PartyDestroyEventGetPayload<{
  include: { User: true }
}>

export type SocketUserEnterEvent = Prisma.UserEnterEventGetPayload<{
  include: { user: true }
}>

export type SocketUserLeaveEvent = Prisma.UserLeaveEventGetPayload<{
  include: { user: true }
}>

export type ChatMessage = {
  createdAt: Date
  event:
    | ({
        type: "ChatEvent"
      } & SocketChatEvent)
    | ({
        type: "PartyCreateEvent"
      } & SocketPartyCreateEvent)
    | ({
        type: "PartyDestroyEvent"
      } & SocketPartyDestroyEvent)
    | ({
        type: "UserEnterEvent"
      } & SocketUserEnterEvent)
    | ({
        type: "UserLeaveEvent"
      } & SocketUserLeaveEvent)
    | ({
        type: "ChangeTeamEvent"
      } & SocketChangeTeamEvent)
}

export type SocketStartDrawingEvent = {
  x: number
  y: number
}
export type SocketDrawEvent = {
  x: number
  y: number
}

export type SocketFinishDrawingEvent = {
  x: number
  y: number
}

export type SocketChangeTeamEvent = {
  team: "red" | "blue"
  user: SimpleUser
}

export type SimpleUser = {
  id: string
  name: string
  image: string | null
}

export type GameState =
  | "LOBBY"
  | "TOSS"
  | "ROUND_CHANGE"
  | "GUESS_TIMEOUT"
  | "GUESS_CORRECT"

export type SocketChangeGameStateEvent =
  | {
      state: "LOBBY"
    }
  | {
      state: "TOSS"
    }
  | {
      state: "ROUND_CHANGE"
      round: number
      rounds: number
      drawingTeam: "red" | "blue"
      drawingUserId: string
      words: Word[]
    }
  | {
      state: "DRAWING"
      word: Word
      timeToGuess: number
    }
  | {
      state: "GUESS_TIMEOUT"
    }
  | {
      state: "GUESS_CORRECT"
      guesserId: string
    }
  | {
      state: "GAME_OVER"
    }

export type SocketGuessEvent = {
  guess: string
}

export type SocketStartGameEvent = {
  rounds: number
  timeToGuess: number
  category: string
  wordChoices: number
}

export type SocketUserVoteWordEvent = {
  word: string
}

export type SocketVoteWordEvent = {
  userId: string
  word: string
}

export type SocketAddPointsEvent = {
  team: "red" | "blue"
  userId: string
  points: number
}
