"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, User, Play, Pause, SkipForward } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Message {
  id: string
  sender: string
  text: string
  timestamp: number
}

interface RoomInfo {
  id: string
  youtubeUrl?: string
  isHost: boolean
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // YouTube video ID extraction function
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url?.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      navigate("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)
    setDisplayName(userData.username || userData.email.split("@")[0])

    // Get room info
    const storedRoom = localStorage.getItem("currentRoom")
    if (!storedRoom) {
      navigate("/dashboard")
      return
    }

    const roomData = JSON.parse(storedRoom)
    if (roomData.id !== id) {
      navigate("/dashboard")
      return
    }

    setRoomInfo(roomData)

    // Add some sample messages
    setMessages([
      {
        id: "1",
        sender: "System",
        text: "Welcome to the watch party!",
        timestamp: Date.now(),
      },
    ])

    // Cleanup function
    return () => {
      // In a real app, you would disconnect from any real-time services here
    }
  }, [id, navigate])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showChat])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: displayName,
      text: newMessage,
      timestamp: Date.now(),
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleUpdateDisplayName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return

    // Add system message about name change
    const message: Message = {
      id: Date.now().toString(),
      sender: "System",
      text: `${user.username || user.email.split("@")[0]} changed their name to ${displayName}`,
      timestamp: Date.now(),
    }

    setMessages([...messages, message])
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    // In a real app, you would sync this with other users
  }

  const handleSkipForward = () => {
    // In a real app, you would implement seeking and sync with other users
    console.log("Skip forward")
  }

  const handleLeaveRoom = () => {
    localStorage.removeItem("currentRoom")
    navigate("/dashboard")
  }

  if (!user || !roomInfo) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }

  const videoId = roomInfo.youtubeUrl ? getYouTubeVideoId(roomInfo.youtubeUrl) : null

  const renderVideoPlayer = () => (
    <div className="relative w-full h-full bg-zinc-800 flex items-center justify-center">
      {videoId ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      ) : (
        <div className="text-center p-4">
          <p className="text-xl font-bold">VIDEO</p>
          <p className="text-sm text-zinc-400 mt-2">Waiting for host to start a video...</p>
        </div>
      )}

      {roomInfo.isHost && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/70 p-2 rounded-full">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-white hover:bg-zinc-700"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-white hover:bg-zinc-700"
            onClick={handleSkipForward}
          >
            <SkipForward size={20} />
          </Button>
        </div>
      )}
    </div>
  )

  const renderChatPanel = () => (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-medium">Chat</h3>
        {!isDesktop && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowChat(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{message.sender}</span>
              <span className="text-xs text-zinc-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-zinc-300">{message.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Button variant="red" type="submit">
            Send
          </Button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen min-w-screen bg-black text-white flex flex-col">
      <header className="p-2 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold">Room: {roomInfo.id}</h1>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{roomInfo.isHost ? "Host" : "Guest"}</span>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleUpdateDisplayName} className="flex gap-2">
            <Input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="gray"
              className="h-8"
            >
              <User size={14} className="mr-1" />
              Update
            </Button>
          </form>

          <Button size="sm" variant="red" onClick={handleLeaveRoom} className="h-8">
            Leave
          </Button>
        </div>
      </header>

      <main className="flex-1 flex">
        {isDesktop ? (
          <>
            <div className="flex-1 h-[calc(100vh-64px)]">{renderVideoPlayer()}</div>
            {showChat && <div className="w-80 border-l border-zinc-800 h-[calc(100vh-64px)]">{renderChatPanel()}</div>}
            {/* <div
            className={`w-80 border-l border-zinc-800 h-[calc(100vh-64px)] transition-all duration-300 ease-in-out transform ${
              showChat ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
            }`}
          >
            {renderChatPanel()}
          </div> */}
          </>
        ) : (
          <div className="flex-1 h-[calc(100vh-64px)]">{renderVideoPlayer()}</div>
        )}
      </main>

      <div className="fixed bottom-4 right-20 z-10">
        {isDesktop ? (
          <Button
            onClick={() => setShowChat(!showChat)}
            className={showChat ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-700"}
          >
            <MessageSquare size={18} className="mr-2" />
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
        ) : (
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 p-0">
                <MessageSquare size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] bg-zinc-900 border-zinc-800 text-white">
              {renderChatPanel()}
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  )
}
