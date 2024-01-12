import { db } from "@/server/db"
import type {
  SocketChangeTeamEvent,
  SocketChatEvent,
  SocketDrawEvent,
  SocketFinishDrawingEvent,
  SocketPartyCreateEvent,
  SocketPartyDestroyEvent,
  SocketStartDrawingEvent,
  SocketUserEnterEvent,
} from "@/types"
import { Server } from "socket.io"

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
})

const userPartyMap = new Map<string, string>()
const socketUserMap = new Map<string, string>()
const partyTeams = new Map<string, { red: Set<string>; blue: Set<string> }>()

io.on("connection", (socket) => {
  console.log("connected", socket.id)

  socket.on("SocketIdentify", async (userId: string) => {
    socketUserMap.set(socket.id, userId)
    io.to(socket.id).emit("SocketIdentifyAck")
    console.log(socket.id, "identified as", userId)
  })

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
        const emitEvent: SocketPartyCreateEvent = event.PartyCreateEvent
        io.to(socket.id).emit("SocketPartyCreateEvent", emitEvent)
      }
      if (event.PartyDestroyEvent) {
        const emitEvent: SocketPartyDestroyEvent = event.PartyDestroyEvent
        io.to(socket.id).emit("SocketPartyDestroyEvent", emitEvent)
      }
      if (event.UserEnterEvent) {
        const emitEvent: SocketUserEnterEvent = event.UserEnterEvent
        io.to(socket.id).emit("SocketUserEnterEvent", emitEvent)
      }
      if (event.UserLeaveEvent) {
        const emitEvent: SocketUserEnterEvent = event.UserLeaveEvent
        io.to(socket.id).emit("SocketUserLeaveEvent", emitEvent)
      }
      if (event.ChatEvent) {
        const emitEvent: SocketChatEvent = {
          userId: event.ChatEvent.userId,
          name: event.ChatEvent.user.name ?? "",
          image: event.ChatEvent.user.image,
          message: event.ChatEvent.message,
        }
        io.to(socket.id).emit("SocketChatEvent", emitEvent)
      }

      if (event.ChangeTeamEvent) {
        const emitEvent: SocketChangeTeamEvent = {
          user: {
            id: event.ChangeTeamEvent.userId,
            name: event.ChangeTeamEvent.user.name ?? "",
            image: event.ChangeTeamEvent.user.image,
          },
          team: event.ChangeTeamEvent.team,
        }
        io.to(socket.id).emit("SocketChangeTeamEvent", emitEvent)
      }
    }
  })

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

    io.to(partyId).emit("SocketChatEvent", event)

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

  socket.on("SocketStartDrawing", (event: SocketStartDrawingEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    socket.to(partyId).emit("SocketStartDrawing", event)
  })

  socket.on("SocketDraw", (event: SocketDrawEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    socket.to(partyId).emit("SocketDraw", event)
  })

  socket.on("SocketFinishDrawing", (event: SocketFinishDrawingEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    socket.to(partyId).emit("SocketFinishDrawing", event)
  })

  socket.on("SocketChangeTeamEvent", async (event: SocketChangeTeamEvent) => {
    const userId = socketUserMap.get(socket.id)
    if (!userId) return
    const partyId = userPartyMap.get(userId)
    if (!partyId) return

    let teams
    if (partyTeams.has(partyId)) {
      teams = partyTeams.get(partyId)
    } else {
      teams = {
        red: new Set<string>(),
        blue: new Set<string>(),
      }
    }
    if (event.team === "red") {
      teams?.blue.delete(userId)
      teams?.red.add(userId)
    } else if (event.team === "blue") {
      teams?.red.delete(userId)
      teams?.blue.add(userId)
    }

    io.to(partyId).emit("SocketChangeTeamEvent", event)
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
})

io.listen(3001)
