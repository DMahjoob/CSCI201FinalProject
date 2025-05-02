import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 text-white border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Watch Party</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-zinc-400 mb-6">Watch videos together with friends in real-time</p>
          <div className="flex justify-center gap-4">
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="text-white border-zinc-700 hover:bg-zinc-800">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
