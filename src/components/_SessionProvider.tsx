"use client"

import { type Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { type ReactNode } from "react"

/*
  SessionProvider makes use of useContext, which is only available when using
  the "use client" directive.
*/

export function ClientSessionProvider({
  session,
  children,
}: {
  session: Session | null
  children: ReactNode
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
