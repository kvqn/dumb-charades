"use client"

import { socket } from "@/client/socket"
import { titleCase } from "@/client/utils"
import { Coin } from "@/components/Coin"
import { Countdown } from "@/components/Countdown"
import { Word } from "@/server/words"
import type {
  SocketDrawEvent,
  SocketFinishDrawingEvent,
  SocketStartDrawingEvent,
} from "@/types"
import { useEffect, useRef, useState } from "react"

export function DrawingCanvas({
  isUserDrawing,
  timeToGuess,
  word,
  knowsTheWord,
}: {
  isUserDrawing: boolean
  timeToGuess: number
  word: Word
  knowsTheWord: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hiddenWord, setHiddenWord] = useState("_".repeat(word.word.length))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2

    const context = canvasRef.current?.getContext("2d")
    if (!context) return

    context.scale(2, 2)
    context.lineCap = "round"
    context.strokeStyle = "black"
    context.lineWidth = 5
    contextRef.current = context

    const SocketStartDrawingHandler = (event: SocketStartDrawingEvent) => {
      console.log("received start drawing event")
      startDrawing(event.x, event.y)
    }

    const SocketDrawHandler = (event: SocketDrawEvent) => {
      console.log("received draw event")
      draw(event.x, event.y)
    }

    const SocketFinishDrawingHandler = (event: SocketFinishDrawingEvent) => {
      finishDrawing(event.x, event.y)
    }

    socket.on("SocketStartDrawing", SocketStartDrawingHandler)
    socket.on("SocketDraw", SocketDrawHandler)
    socket.on("SocketFinishDrawing", SocketFinishDrawingHandler)

    return () => {
      socket.off("SocketStartDrawing", SocketStartDrawingHandler)
      socket.off("SocketDraw", SocketDrawHandler)
      socket.off("SocketFinishDrawing", SocketFinishDrawingHandler)
    }
  }, [])

  const startDrawing = (x: number, y: number) => {
    const context = contextRef.current
    if (!context) return

    context.beginPath()
    console.log(x, y)
    context.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (x: number, y: number) => {
    console.log(x, y)
    // if (!isDrawing) return
    const context = contextRef.current
    context?.lineTo(x, y)
    context?.stroke()
  }

  const finishDrawing = (x: number, y: number) => {
    const context = contextRef.current
    context?.closePath()
    setIsDrawing(false)
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-2 top-2">
        <Countdown seconds={timeToGuess} />
      </div>
      <div className="absolute top-2 w-full text-center">
        {knowsTheWord || isUserDrawing ? titleCase(word.word) : hiddenWord}
      </div>
      <div className="absolute left-2 top-2 flex gap-2">
        {word.points}
        <div className="pt-[0.5px]">
          <Coin />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="h-full  w-full border-4"
        onMouseDown={(event) => {
          if (!isUserDrawing) return
          startDrawing(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
          socket.emit("SocketStartDrawing", {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
          })
        }}
        onMouseMove={(event) => {
          if (!isUserDrawing || !isDrawing) return
          const x = event.nativeEvent.offsetX
          const y = event.nativeEvent.offsetY
          draw(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
          socket.emit("SocketDraw", { x: x, y: y })
        }}
        onMouseUp={(event) => {
          if (!isUserDrawing) return
          const x = event.nativeEvent.offsetX
          const y = event.nativeEvent.offsetY
          finishDrawing(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
          socket.emit("SocketFinishDrawing", { x: x, y: y })
        }}
      />
    </div>
  )
}
