import { redirect } from "next/navigation"
import { getToken } from "@/utils/auth"

export default function Home() {
  // Check if user is authenticated
  const token = getToken()

  // If authenticated, redirect to dashboard, otherwise to login
  if (token) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }

  // This won't be reached, but is needed for TypeScript
  return null
}
