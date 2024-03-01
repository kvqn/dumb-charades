import Image from "next/image"
import { twMerge } from "tailwind-merge"

export function UserImage({
  src,
  className,
  scale = 1,
  size = 20,
  onClick,
}: {
  src: string | undefined | null
  className?: string
  scale?: number
  size?: number
  onClick?: () => void
}) {
  return (
    <div
      className={twMerge(
        "flex-shrink-0 overflow-hidden rounded-full border-2 border-black",
        className,
      )}
      style={{
        scale: scale,
        height: size,
        width: size,
      }}
      onClick={onClick}
    >
      {src ? <Image width={size} height={size} src={src} alt="img" /> : null}
    </div>
  )
}
