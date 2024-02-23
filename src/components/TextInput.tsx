import { twMerge } from "tailwind-merge"

export function TextInput({
  placeholder,
  className,
  onChange,
}: {
  placeholder?: string | null
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      type="text"
      placeholder={placeholder ?? ""}
      className={twMerge(
        "w-60 rounded-xl border border-black px-4 py-2 font-virgil",
        className,
      )}
      onChange={onChange}
    />
  )
}
