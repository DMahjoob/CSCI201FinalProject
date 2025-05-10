import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("")
  const [error, setError] = useState("") 
  const navigate = useNavigate()

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!roomCode.trim()) {
      setError("Please enter a room code")
      return
    }
    
    try {
      // Generate a random guest ID
      const guestId = `guest_${Math.floor(Math.random() * 10000)}`
      
      // Check if room exists
      const response = await fetch(`http://localhost:8080/CS201FP/JoinRoomServlet?roomCode=${roomCode}&user_id=${guestId}`, {
        method: 'POST',
      })
      
      const text = await response.text()
      
      if (text === "false") {
        setError("Invalid room code. Please try again.")
        return
      }
      
      // Store guest info in localStorage
      localStorage.setItem("user", JSON.stringify({
        id: guestId,
        email: null,
        username: `Guest ${guestId.split('_')[1]}`,
        isGuest: true
      }))
      
      // Store current room in localStorage
      localStorage.setItem("currentRoom", JSON.stringify({
        id: roomCode,
        isHost: false
      }))
      
      // Navigate to room
      navigate(`/room/${roomCode}`)
      
    } catch (error) {
      console.error("Error joining room:", error)
      setError("Failed to join room. Please try again.")
    }
  }
  
  return (
    <main className="flex min-h-screen min-w-screen flex-col items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 text-white border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">BingeBaddies Watch Party</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-center text-zinc-400">Watch videos together with friends in real-time</p>
          
          <div className="flex flex-col gap-4">
            <form onSubmit={handleGuestJoin} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="roomCode" className="text-sm font-medium leading-none mb-2 block">Join as a guest</label>
                <div className="flex gap-2">
                  <Input
                    id="roomCode"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button type="submit" variant="red">
                    Join
                  </Button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </form>
          </div>
          
          <div className="h-px w-full bg-zinc-800 my-4" />
          
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-3">Already have an account?</p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline" className="border-zinc-800 text-white bg-red-700">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" className="border-zinc-800 text-black bg-zinc-500">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
