'use client'

import { signIn } from "@/lib/authClient"
import { Button } from "../ui/button"

const LoginButton = () => {
  const handleLogin = async () => {
    await signIn.social({
      provider:'google',
      callbackURL: '/'
    })
  }
  return (
    <Button onClick={handleLogin} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-6 text-base font-medium cursor-pointer">
        <span>Sign in with Google</span>
    </Button>
  )
}
export default LoginButton