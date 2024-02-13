import { Navbar } from "@/components/Navbar"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col bg-teal-50 font-virgil">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
