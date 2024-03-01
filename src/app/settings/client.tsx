"use client"

import { TextInput } from "@/components/TextInput"
import { UserImage } from "@/components/UserImage"
import { changeSettings } from "@/server/actions/changeSettings"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { type Session } from "next-auth"
import { signOut } from "next-auth/react"
import { redirect, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { twMerge } from "tailwind-merge"

export function SettingsPage_ClientSide({
  session,
}: {
  session: Session | null
}) {
  const loggedIn = session && session.user ? true : false
  const [username, setUsername] = useState(session?.user.name)
  const [userImage, setUserImage] = useState(session?.user.image!)
  const [changes, setChanges] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const originalUsername = session?.user.name

  const router = useRouter()
  const searchParams = useSearchParams()

  const userAllImages: string[] = [
    session?.user.image!,
    "/static/images/avatar-1.png",
    "/static/images/avatar-2.png",
    "/static/images/avatar-3.png",
  ]

  useEffect(() => {
    const _ = async () => {
      // await sleep(1000)
      if (searchParams.get("success")) {
        toast.success("Settings updated!")
      }
    }
    void _()
  }, [])

  useEffect(() => {
    if (username != originalUsername || userImage != session?.user.image) {
      setChanges(true)
    } else {
      setChanges(false)
    }
  }, [username, userImage, changes])

  if (typeof username != "string") return

  const handleSubmit = async () => {
    setSubmitting(true)
    const resp = await changeSettings({
      userProfile: { username: username, image: userImage },
    })
    if (resp.status === "error") {
      setSubmitting(false)
      toast.error(resp.message)
    } else {
      router.push("/settings?success=true", {})
      location.reload()
    }
  }

  if (!loggedIn) return <div>Not logged in</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="text-5xl">Settings</div>
      <div className="rounded-xl border-2 border-black bg-white p-8">
        <div className="text-4xl">User Profile</div>
        <div className="flex flex-col gap-4 pt-4 text-2xl">
          <div className="flex w-full justify-end">
            <div
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-black bg-red-300 px-4 py-2 text-lg hover:border-red-800 hover:bg-red-400"
              onClick={async () => {
                await signOut()
                redirect("/")
              }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              Sign Out
            </div>
          </div>
          <div className="flex w-full items-center gap-4">
            <div className="w-1/3 text-right">Username</div>
            <TextInput
              placeholder={session?.user.name}
              className=""
              onChange={(e) => {
                console.log(e.target.value)
                if (e.target.value == "") setUsername(originalUsername)
                else setUsername(e.target.value)
              }}
            />
          </div>
          <div className="flex w-full items-center gap-4">
            <div className="w-1/3 text-right">Avatar</div>
            <UserImage src={userImage} size={100} />
            <div className="w-max-[20%] flex h-[100px] flex-col flex-wrap items-center justify-center gap-4">
              {userAllImages.map((img, i) => (
                <UserImage
                  size={40}
                  src={img}
                  key={i}
                  onClick={() => {
                    setUserImage(img)
                  }}
                  className="cursor-pointer hover:scale-110"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <div
            className={twMerge(
              "w-fit cursor-pointer rounded-xl border-2 border-blue-300 bg-blue-200 px-4 py-2 ",
              changes
                ? "hover:border-blue-200 hover:bg-blue-300"
                : "cursor-no-drop",
              submitting && "cursor-no-drop",
            )}
            onClick={async () => {
              if (submitting) return
              await handleSubmit()
            }}
          >
            {submitting ? "Saving changes ..." : "Save changes"}
          </div>
        </div>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-virgil",
        }}
      />
    </div>
  )
}
