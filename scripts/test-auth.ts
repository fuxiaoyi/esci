import { supabase } from '../src/lib/supabase'

async function testAuth() {
  try {
    console.log('Testing authentication for fuxiaoyi@kongfoo.cn...')
    
    // Test sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'fuxiaoyi@kongfoo.cn',
      password: '123456'
    })
    
    if (error) {
      console.error('Authentication failed:', error.message)
      
      // If authentication fails, try to reset password or create user
      if (error.message.includes('Invalid login credentials')) {
        console.log('Attempting to reset password...')
        
        // Try to reset password (this requires the user to have access to the email)
        const { error: resetError } = await supabase.auth.resetPasswordForEmail('fuxiaoyi@kongfoo.cn', {
          redirectTo: 'http://localhost:3000/auth/reset-password'
        })
        
        if (resetError) {
          console.error('Password reset failed:', resetError.message)
        } else {
          console.log('Password reset email sent. Please check the email to reset password.')
        }
      }
    } else {
      console.log('Authentication successful!', data)
    }
    
  } catch (error) {
    console.error('Error testing authentication:', error)
  }
}

testAuth()