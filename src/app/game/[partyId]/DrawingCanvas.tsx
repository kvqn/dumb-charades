"use client"

import { socket } from "@/client/socket"
import type {
  SocketDrawEvent,
  SocketFinishDrawingEvent,
  SocketStartDrawingEvent,
} from "@/types"
import { useEffect, useRef, useState } from "react"

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const [isUserDrawing, setIsUserDrawing] = useState(true)

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
    <canvas
      ref={canvasRef}
      className="h-[500px] w-[700px] border-4"
      onMouseDown={(event) => {
        startDrawing(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
        socket.emit("SocketStartDrawing", {
          x: event.nativeEvent.offsetX,
          y: event.nativeEvent.offsetY,
        })
      }}
      onMouseMove={(event) => {
        const x = event.nativeEvent.offsetX
        const y = event.nativeEvent.offsetY
        draw(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
        socket.emit("SocketDraw", { x: x, y: y })
      }}
      onMouseUp={(event) => {
        const x = event.nativeEvent.offsetX
        const y = event.nativeEvent.offsetY
        finishDrawing(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
        socket.emit("SocketFinishDrawing", { x: x, y: y })
      }}
    />
  )
}
