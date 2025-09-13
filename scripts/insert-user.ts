import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Create user in local database
    const user = await prisma.user.create({
      data: {
        email: 'fuxiaoyi@kongfoo.cn',
        name: 'fuxiaoyi',
        emailVerified: new Date(),
        superAdmin: false
      }
    })
    
    console.log('User created successfully:', user)
    
    // Note: Since we're using Supabase authentication, the actual authentication
    // will be handled by Supabase. This user record is for local application data only.
    // The user will need to register through the Supabase auth system.
    
  } catch (error) {
    console.error('Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()