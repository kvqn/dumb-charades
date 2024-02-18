import Image from "next/image"
import { twMerge } from "tailwind-merge"

export function UserImage({
  src,
  className,
  scale,
}: {
  src: string | undefined | null
  className?: string
  scale?: number
}) {
  return (
    <div
      className={twMerge(
        "h-[20px] w-[20px] flex-shrink-0 overflow-hidden rounded-full border-2 border-black",
        className,
      )}
      style={{
        scale: scale ?? 1,
      }}
    >
      {src ? <Image width={20} height={20} src={src} alt="img" /> : null}
    </div>
  )
}
