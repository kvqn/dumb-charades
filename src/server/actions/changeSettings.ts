"use server"

import { getServerAuthSession } from "../auth"
import { db } from "../db"

function checkValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9\-\_]{3,}$/.test(username)
}

export async function changeSettings(settings: {
  userProfile: {
    username: string
  }
}): Promise<
  | {
      status: "success"
    }
  | {
      status: "error"
      message: string
    }
> {
  const session = await getServerAuthSession()

  if (!session || !session.user)
    return {
      status: "error",
      message: "Not logged in",
    }

  console.log("change settings for user ", session.user.name, settings)

  const validUsername = checkValidUsername(settings.userProfile.username)
  if (!validUsername)
    return {
      status: "error",
      message: "Invalid username",
    }
  await db.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      name: settings.userProfile.username,
    },
  })

  return { status: "success" }
}
