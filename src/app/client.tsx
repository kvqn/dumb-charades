"use client"

import { useState } from "react"

export function AboutTheGame() {
  const [tldr, setTldr] = useState(false)
  return (
    <div className="flex w-1/2 flex-col items-center">
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
