import React from 'react'
import './AppWrapper.css'

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return <div className="app-wrapper">{children}</div>
}
