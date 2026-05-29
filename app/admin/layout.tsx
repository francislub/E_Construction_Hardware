import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/auth/login')
  }

  return (
    <AdminLayoutClient email={session.user.email}>
      {children}
    </AdminLayoutClient>
  )
}