"use client"

import { TextInput } from "@/components/TextInput"
import Link from "next/link"
import { useEffect, useState } from "react"
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
      <Link
        className="flex flex-grow items-center text-4xl hover:font-bold"
        href="/api/auth/signin"
      >
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

function randomColor() {
  const randomColor = Math.floor(Math.random() * 16777215)
  const hexColor = "#" + randomColor.toString(16).padStart(6, "0")
  return hexColor
}

export function FancyTitle() {
  const [colors, setColors] = useState<string[]>(Array(13).fill("black"))
  const queue: string[] = []
  const [renders, reRender] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      const _colors = colors
      for (let i = 13; i >= 1; i--) {
        _colors[i] = _colors[i - 1]!
      }
      console.log(queue)
      _colors[0] = queue.length === 0 ? "black" : queue.shift()!
      setColors(_colors)
      reRender(renders + 1)
    }, 200)
  }, [renders])

  function clickAction() {
    const color = randomColor()
    queue.push(color)
  }

  return (
    <div
      className="flex h-1/3 cursor-pointer select-none items-center text-8xl font-black"
      onClick={clickAction}
    >
      <p style={{ color: colors[0] }}>S</p>
      <p style={{ color: colors[1] }}>c</p>
      <p style={{ color: colors[2] }}>r</p>
      <p style={{ color: colors[3] }}>i</p>
      <p style={{ color: colors[4] }}>b</p>
      <p style={{ color: colors[5] }}>b</p>
      <p style={{ color: colors[6] }}>l</p>
      <p style={{ color: colors[7] }}>e</p>
      <p style={{ color: colors[8], width: "2rem" }}> </p>
      <p style={{ color: colors[9] }}>W</p>
      <p style={{ color: colors[10] }}>a</p>
      <p style={{ color: colors[11] }}>r</p>
      <p style={{ color: colors[12] }}>s</p>
    </div>
  )
}
