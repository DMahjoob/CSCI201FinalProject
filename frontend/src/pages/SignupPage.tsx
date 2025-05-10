"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, useNavigate } from "react-router-dom"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const [error, setError] = useState("")
  const [fullName, setFullName] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:8080/CS201FP/Signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName || username, // Using username as fullName if not provided
          username,
          email,
          password
        })
      })

      const data = await response.json()

      if (data.status === 'success') {
        // Store user info in localStorage
        localStorage.setItem("user", JSON.stringify({
          id: data.userId || Math.floor(Math.random() * 10000), // Fallback if userId not provided
          email,
          username,
          isAuthenticated: true,
          isGuest: false
        }))
        
        setIsLoading(false)
        navigate("/dashboard")
      } else if (data.status === 'invalid') {
        setError(data.message || "User with this email already exists.")
        setIsLoading(false)
      } else {
        throw new Error(data.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError("Failed to sign up. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 text-white border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-center">Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
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
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? "Signing up..." : "Sign up"}
            </Button>
            <div className="text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="text-red-500 hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
