import "@/styles/globals.css"

export const metadata = {
  title: "Scribble Wars",
  description: "A drawing game.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="pattern-dots-md h-screen w-screen bg-teal-50 text-gray-200">
          <div className="flex h-full flex-col overflow-hidden font-virgil text-black">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
