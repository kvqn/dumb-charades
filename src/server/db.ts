import { PrismaClient } from "@prisma/client"

import { env } from "@/env"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log:
    //   env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db

export async function updateUserLastSeen(userId: string): Promise<void> {
  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      lastSeen: new Date(),
    },
  })
}
