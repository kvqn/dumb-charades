"use client"

import { TextInput } from "@/components/TextInput"
import Link from "next/link"
import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { tryToJoinParty } from "@/server/actions/tryToJoinParty"
import toast from "react-hot-toast"

export function AboutTheGame() {
  const [tldr, setTldr] = useState(false)
  return (
    <div className="flex w-1/2 flex-col items-center justify-center py-20">
      <div className="text-xl font-bold">
        How to play ({tldr ? "TLDR" : "The long version"})
      </div>
      <button
        className="text-sm text-gray-500 hover:underline"
        onClick={() => {
          setTldr(!tldr)
        }}
      >
        {tldr ? "Give me the long version" : "I'm not gonna read all this"}
      </button>
      {tldr ? (
        <ul>
          <li>- Choose a team</li>
          <li>- Player is randomly chosen from guessing team</li>
          <li>- Other team choses word to be drawn</li>
          <li>- More difficult word will give more points</li>
          <li>- Quicker guesses give better rewards.</li>
          <li>- Swap roles and the rounds continue.</li>
          <li>- Get more points than the other team to win</li>
        </ul>
      ) : (
        <div className="items-center text-justify [text-align-last:center]">
          {
            "Get a team, draw straws, and start doodling! The other team picks a word for your artist. Quick guesses mean more points, but the clock's ticking. Swipe points from the other side. Switch roles every round. Set rounds and choose word types. Want a challenge? Toss in custom words, but it'll cost you. Outsmart and outdraw for the win! Have a blast in the Scribble Wars."
          }
        </div>
      )}
    </div>
  )
}

export function StartGame({ loggedIn }: { loggedIn: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const [partyCode, setPartyCode] = useState("")

  if (!loggedIn)
    return (
      <Link className="flex flex-grow items-center" href="/api/auth/signin">
        Log in to play
      </Link>
    )

  if (!revealed)
    return (
      <div className="flex flex-grow flex-col items-center justify-center text-3xl">
        <Link href="/create" className="hover:font-black">
          Create a party
        </Link>
        <div
          className="cursor-pointer hover:font-black"
          onClick={() => {
            setRevealed(true)
          }}
        >
          Join a party
        </div>
      </div>
    )

  return (
    <div className="flex flex-grow items-center justify-center">
      <div className="relative flex flex-col items-center justify-center rounded-xl border border-black bg-amber-200 px-8 py-4">
        <div
          className="z absolute -top-1 right-2 cursor-pointer hover:font-bold"
          onClick={() => {
            setRevealed(false)
          }}
        >
          x
        </div>
        <div className="text-xl">Enter Party Code :</div>
        <div className="flex items-center gap-2">
          <TextInput
            className="w-100"
            onChange={(e) => {
              setPartyCode(e.target.value)
            }}
          />
          <FontAwesomeIcon
            icon={faCheck}
            className="cursor-pointer rounded-lg border border-black bg-green-300 p-2 hover:bg-green-400"
            onClick={async () => {
              console.log("A")
              const resp = await tryToJoinParty(partyCode)
              console.log("B", resp)
              if (resp.status == "error") {
                toast.error(resp.message)
                console.log("C")
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
