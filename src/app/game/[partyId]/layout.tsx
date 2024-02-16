import { Navbar } from "@/components/Navbar"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <link href="https://unpkg.com/pattern.css" rel="stylesheet"></link>
      <body className="h-screen bg-teal-50 font-virgil">
        <div className="pattern-dots-md flex h-full w-full flex-col text-gray-200">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}
