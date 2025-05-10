"use client"

import { type ReactNode, useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    setIsAuthenticated(!!user)
  }, [])

  if (isAuthenticated === null) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
