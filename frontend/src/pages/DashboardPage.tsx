"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<{ username?: string; email: string } | null>(null)
  const [roomId, setRoomId] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      navigate("/login")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [navigate])

  const handleCreateRoom = () => {
    // Generate a random room ID
    const newRoomId = Math.random().toString(36).substring(2, 8)

    // Store room info
    localStorage.setItem(
      "currentRoom",
      JSON.stringify({
        id: newRoomId,
        youtubeUrl,
        isHost: true,
      }),
    )

    navigate(`/room/${newRoomId}`)
  }

  const handleJoinRoom = () => {
    if (!roomId) return

    // Store room info
    localStorage.setItem(
      "currentRoom",
      JSON.stringify({
        id: roomId,
        isHost: false,
      }),
    )

    navigate(`/room/${roomId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/")
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }

  return (
    <div className="min-h-screen min-w-screen bg-black text-white">
      <header className="p-4 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Watch Party</h1>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-3xl bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Welcome, {user.username || user.email}</h2>
                <p className="text-zinc-400">Create a new watch party or join an existing one</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 min-w-[150px]">Create Room</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Create a Watch Party</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">YouTube Video URL</label>
                        <Input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <Button
                        onClick={handleCreateRoom}
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={!youtubeUrl}
                      >
                        Create Room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 min-w-[150px]">
                      Join Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Join a Watch Party</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Room ID</label>
                        <Input
                          type="text"
                          placeholder="Enter room ID"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <Button
                        onClick={handleJoinRoom}
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={!roomId}
                      >
                        Join Room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
