// React Imports
import type { ReactNode } from 'react'

import { AuthProvider } from '@/components/auth/AuthProvider'
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
        <TooltipProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>{children}</SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default Providers
