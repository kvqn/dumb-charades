import { getServerAuthSession } from "@/server/auth"

export function Navbar() {
  return (
    <div className="flex w-screen justify-end p-2 text-xl">
      <LoggedInStatus />
    </div>
  )
}

async function LoggedInStatus() {
  const session = await getServerAuthSession()
  const loggedIn = session && session.user

  if (loggedIn) return <div>Logged in as : {session.user.name}</div>
  return <div>Sign In</div>
}
