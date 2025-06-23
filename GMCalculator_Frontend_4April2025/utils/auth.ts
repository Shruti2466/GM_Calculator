// utils/auth.ts
 
// interface AuthData {
//   token: string
//   email: string
//   role: string
//   userName: string
//   userId: string
//   employeeTableId: number
//   role_id?: number
// }
type AuthData = {
  token: string;
  email: string;
  role: string;
  userName: string;
  userId: number;
  employeeTableId?:number;
  role_id?: number;
};
 
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
 
// export const getAuth = (): AuthData | null => {
//   if (typeof window !== "undefined") {
//     // Client-side: Get auth data from localStorage
//     const authData = localStorage.getItem("authData")
//     console.log("authData :",authData);
//     return authData ? JSON.parse(authData) : null
//   } else {
//     // Server-side: Get auth data from cookies
//     const { cookies } = require("next/headers")
//     const authData = cookies().get("authData")?.value
//     return authData ? JSON.parse(authData) : null
//   }
// }
 
export const getAuth = (): AuthData | null => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
 
    // If token exists in the URL, update localStorage
    if (token) {
      const email = urlParams.get("email") || "";
      const role = urlParams.get("role") || "";
      const role_id = parseInt(urlParams.get("role_id") || "0");
      const userId = parseInt(urlParams.get("userId") || "0");
      const userName = urlParams.get("userName") || "";
 
      const authData: AuthData = {
        token,
        email,
        role,
        role_id,
        userId,
        userName,
      };
 
      localStorage.setItem("authData", JSON.stringify(authData));
    }
 
    const storedAuth = localStorage.getItem("authData");
    return storedAuth ? JSON.parse(storedAuth) : null;
  } else {
    const { cookies } = require("next/headers");
    const storedAuth = cookies().get("authData")?.value;
    return storedAuth ? JSON.parse(storedAuth) : null;
  }
};
 
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
  return authData?.userName
}
 
export const getEmployeeId = () => {
  const authData = getAuth()
  return authData?.userId
}
 
export const getEmployeeTableId = () => {
  const authData = getAuth()
  return authData?.employeeTableId
}