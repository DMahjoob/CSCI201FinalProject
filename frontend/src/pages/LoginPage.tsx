"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, useNavigate } from "react-router-dom"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication
    setTimeout(() => {
      // In a real app, you would validate credentials with your backend
      localStorage.setItem("user", JSON.stringify({ email, isAuthenticated: true }))
      setIsLoading(false)
      navigate("/dashboard")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-black p-4">
      <div className="grid w-full max-w-[900px] grid-cols-1 md:grid-cols-2 gap-6">
        <div className="hidden md:flex md:items-center md:justify-center">
          <div className="h-full w-full bg-zinc-900 rounded-lg flex items-center justify-center">
            <img
              src="/placeholder.svg?height=300&width=300"
              alt="Watch videos together"
              className="max-w-full h-auto"
            />
          </div>
        </div>

        <Card className="w-full bg-zinc-900 text-white border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
              <div className="text-center text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-red-500 hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
