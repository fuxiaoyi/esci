import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { supabase } from '../../lib/supabase'

function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        void router.push('/signin?error=callback_error')
        return
      }

      if (data.session) {
        void router.push('/')
      } else {
        void router.push('/signin')
      }
    }

    void handleAuthCallback()
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Completing authentication...</p>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AuthCallback), {
  ssr: false,
})
