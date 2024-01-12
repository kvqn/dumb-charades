import { type Prisma } from "@prisma/client"

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
  | "TEAM_RED_TO_DRAW"
  | "TEAM_RED_DRAWING"
  | "TEAM_RED_TIME_UP"
  | "TEAM_RED_CORRECT"
  | "TEAM_BLUE_TO_DRAW"
  | "TEAM_BLUE_DRAWING"
  | "TEAM_BLUE_TIME_UP"
  | "TEAM_BLUE_CORRECT"
  | "GAME_OVER"

export type SocketChangeGameStateEvent = {
  state: GameState
}
