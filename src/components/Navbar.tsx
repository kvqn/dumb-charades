import { getServerAuthSession } from "@/server/auth"
import { UserImage } from "./UserImage"

export function Navbar() {
  return (
    <div className="flex w-screen justify-end p-2 text-2xl text-black">
      <LoggedInStatus />
    </div>
  )
}

async function LoggedInStatus() {
  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (loggedIn)
    return (
      <div className="flex items-center gap-2">
        <UserImage scale={1.2} src={session.user.image ?? ""} />{" "}
        {session.user.name}
      </div>
    )
  return <div>Sign In</div>
}
