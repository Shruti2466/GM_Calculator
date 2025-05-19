// utils/auth.ts

interface AuthData {
  token: string
  email: string
  role: string
  employeeName: string
  employeeId: string
  employeeTableId: number
  role_id?: number
}

export const setAuth = (authData: AuthData) => {
  if (typeof window !== "undefined") {
    // Client-side: Use localStorage for auth data storage
    localStorage.setItem("authData", JSON.stringify(authData))
  } else {
    // Server-side: Use cookies
    const { cookies } = require("next/headers")
    cookies().set("authData", JSON.stringify(authData))
  }
}

export const getAuth = (): AuthData | null => {
  if (typeof window !== "undefined") {
    // Client-side: Get auth data from localStorage
    const authData = localStorage.getItem("authData")
    return authData ? JSON.parse(authData) : null
  } else {
    // Server-side: Get auth data from cookies
    const { cookies } = require("next/headers")
    const authData = cookies().get("authData")?.value
    return authData ? JSON.parse(authData) : null
  }
}

export const removeAuth = () => {
  if (typeof window !== "undefined") {
    // Client-side: Remove auth data from localStorage
    localStorage.removeItem("authData")
  } else {
    // Server-side: Delete cookie
    const { cookies } = require("next/headers")
    cookies().delete("authData")
  }
}

export const isAuthenticated = () => {
  const authData = getAuth()
  return !!authData?.token
}

export const getToken = () => {
  const authData = getAuth()
  return authData?.token
}

export const getEmail = () => {
  const authData = getAuth()
  return authData?.email
}

export const getRole = () => {
  const authData = getAuth()
  return authData?.role
}

export const getRoleId = () => {
  const authData = getAuth()
  return authData?.role_id
}

export const getEmployeeName = () => {
  const authData = getAuth()
  return authData?.employeeName
}

export const getEmployeeId = () => {
  const authData = getAuth()
  return authData?.employeeId
}

export const getEmployeeTableId = () => {
  const authData = getAuth()
  return authData?.employeeTableId
}
