import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage } from '@/api/chatApi'

interface UseStompChatOptions {
  conversationId: string | null
  token: string | null
  onMessage: (msg: ChatMessage) => void
}

export function useStompChat({ conversationId, token, onMessage }: UseStompChatOptions) {
  const clientRef = useRef<Client | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current?.connected || !conversationId) return
    clientRef.current.publish({
      destination: `/app/chat/${conversationId}`,
      body: JSON.stringify({ content }),
    })
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !token) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/conversation/${conversationId}`, (frame) => {
          try {
            const msg: ChatMessage = JSON.parse(frame.body)
            onMessageRef.current(msg)
          } catch {
            // ignore malformed frames
          }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [conversationId, token])

  return { sendMessage }
}
