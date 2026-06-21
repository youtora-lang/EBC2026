'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="p-1.5 text-[#9A9A9A] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer"
      aria-label="ログアウト"
    >
      <LogOut className="w-4 h-4" />
    </button>
  )
}
