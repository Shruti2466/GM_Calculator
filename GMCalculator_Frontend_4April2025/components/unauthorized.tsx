"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { AlertCircle, Lock, ArrowLeft, LogIn } from "lucide-react"

const Unauthorized = () => {
  const router = useRouter()

  const handleBackToLogin = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("email")
    localStorage.removeItem("employeeName")
    localStorage.removeItem("employeeId")
    localStorage.removeItem("employeeTableId")
    router.push("/login")
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
     <div className="min-h-screen flex items-center justify-center p-6 bg-background w-full">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Access Denied</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don't have permission to access this application.
            </p>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">This could be because:</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                  You don't have the required role permissions
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                  Your account access has been restricted
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                  Invalid login credentials
                </li>
              </ul>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleBackToLogin} 
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>

          <div className="text-center pt-2 border-t w-full">
            <p className="text-xs text-muted-foreground">
              Need help? Contact your system administrator
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Unauthorized