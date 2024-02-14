import { twMerge } from "tailwind-merge"

export function UserImage({
  src,
  className,
}: {
  src: string | undefined | null
  className?: string
}) {
  return (
    <div
      className={twMerge(
        "h-[20px] w-[20px] flex-shrink-0 overflow-hidden rounded-full border-2 border-black",
        className,
      )}
    >
      {src ? <img src={src} alt="img" /> : null}
    </div>
  )
}
