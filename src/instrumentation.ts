import { db } from "./server/db"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("cleaning up old games")
    await db.party.updateMany({
      where: {
        active: true,
      },
      data: {
        active: false,
      },
    })
  }
}
