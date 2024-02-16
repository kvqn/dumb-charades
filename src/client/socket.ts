import { env } from "@/env"
import { io } from "socket.io-client"

export const socket = io(env.NEXT_PUBLIC_SOCKET_URL)
