import React from 'react'
import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { EventProvider } from '../contexts/EventContext'
import { RealtimeProvider } from '../contexts/RealtimeContext'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <EventProvider>
          <Component {...pageProps} />
        </EventProvider>
      </RealtimeProvider>
    </AuthProvider>
  )
}
