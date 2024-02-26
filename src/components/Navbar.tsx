import { getServerAuthSession } from "@/server/auth"
import { UserImage } from "./UserImage"
import { Settings } from "./NavbarClient"
import Link from "next/link"

export function Navbar({ showTitle = true }) {
  return (
    <div className="flex justify-end p-1 text-2xl text-black">
      {showTitle && <WebpageTitle />}
      <div className="flex-grow"></div>
      <div className="absolute flex flex-col items-end">
        <LoggedInStatus />
        <Settings />
      </div>
    </div>
  )
}

function WebpageTitle() {
  return (
    <Link href="/" className="hover:font-black">
      Scribble Wars
    </Link>
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
