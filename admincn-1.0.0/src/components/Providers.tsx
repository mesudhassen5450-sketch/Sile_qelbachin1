// React Imports
import type { ReactNode } from 'react'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { AdminLocaleProvider } from '@/context/AdminLocaleContext'
import { ThemeProvider } from './ThemeProvider'
import { SidebarProvider } from './ui/sidebar'
import { TooltipProvider } from './ui/tooltip'

type Props = {
  children: ReactNode
  sidebarDefaultOpen?: boolean
}

const Providers = ({ children, sidebarDefaultOpen }: Props) => {
  return (
    <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
      <AuthProvider>
        <AdminLocaleProvider>
          <TooltipProvider>
            <SidebarProvider defaultOpen={sidebarDefaultOpen}>{children}</SidebarProvider>
          </TooltipProvider>
        </AdminLocaleProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default Providers
