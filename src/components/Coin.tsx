import { AlternatingImage } from "./AlternatingImage"

export function Coin({ width = 15, height = 15 }) {
  return (
    <AlternatingImage
      src1="/static/images/coin-1.png"
      src2="/static/images/coin-2.png"
      height={width}
      width={height}
    />
  )
}
