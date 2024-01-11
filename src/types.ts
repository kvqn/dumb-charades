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
