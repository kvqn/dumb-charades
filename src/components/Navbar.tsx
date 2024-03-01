import { LoggedInStatus, Settings } from "./NavbarClient"
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
