// Mock email function for development
export async function sendVerifyEmail(email: string, code: string) {
  try {
    // Simulate email sending in development
    console.log("📧 [DEV] Would send verification email to:", email);
    console.log("📧 [DEV] Verification code:", code);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("📧 [DEV] Email 'sent' successfully");
    return true;
  } catch (error) {
    console.error("Error in email simulation:", error);
    // Don't throw error in development to allow testing
    return true;
  }
}
