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

  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('http://localhost:8080/CS201FP/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (data.status === 'success') {
        // Get user info from the database response
        localStorage.setItem("user", JSON.stringify({
          id: data.userId,
          email,
          username: data.username || email.split('@')[0],
          isAuthenticated: true,
          isGuest: false
        }))

        setIsLoading(false)
        navigate("/dashboard")
      } else if (data.status === 'incorrect') {
        setError("Incorrect email or password")
        setIsLoading(false)
      } else if (data.status === 'invalid') {
        setError("Invalid email")
        setIsLoading(false)
      } else {
        throw new Error('Unknown error')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("Failed to login. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-black p-4">
      <div className="grid max-w-[900px] w-full mx-auto grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <div className="hidden md:flex md:items-center md:justify-center">
          <div className="h-full w-full bg-zinc-900 rounded-lg flex items-center justify-center">
            <img
              src="logo.png"
              alt="Watch videos together"
              className="max-w-full h-auto drop-shadow-[0_0_15px_rgba(255,65,54,0.9)]"
            />
          </div>
        </div>
        <div className="flex items-center justify-center">
        <Card className="w-full bg-zinc-900 text-white border-zinc-800 pb-25">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-center pt-20">Login</CardTitle>
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
              {error && (
                <div className="text-red-500 text-sm text-center py-2">
                  {error}
                </div>
              )}
              <Button type="submit" variant="red" className="w-full" disabled={isLoading}>
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
    </div>
  )
}
