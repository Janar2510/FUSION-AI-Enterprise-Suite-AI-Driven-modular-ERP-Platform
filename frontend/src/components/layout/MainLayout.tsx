import React from 'react'
import { AppShell } from './AppShell'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <AppShell>{children}</AppShell>
)
