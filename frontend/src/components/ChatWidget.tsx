import { useRef, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, ChevronLeft, Loader2 } from 'lucide-react'
import { chatApi } from '@/api/chatApi'
import type { ChatMessage, ConversationSummary } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useStompChat } from '@/hooks/useStompChat'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface ConversationViewProps {
  conversation: ConversationSummary
  currentUserId: string
  accessToken: string
  onBack: () => void
}

function ConversationView({ conversation, currentUserId, accessToken, onBack }: ConversationViewProps) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['chat-messages', conversation.id],
    queryFn: () => chatApi.getMessages(conversation.id),
    staleTime: 0,
  })

  // Merge history + real-time messages (dedup by id)
  const allMessages = [...history]
  localMessages.forEach((lm) => {
    if (!allMessages.find((m) => m.id === lm.id)) {
      allMessages.push(lm)
    }
  })
  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const { sendMessage } = useStompChat({
    conversationId: conversation.id,
    token: accessToken,
    onMessage: (msg) => {
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const content = input.trim()
    if (!content) return
    sendMessage(content)
    setInput('')
  }

  const otherName =
    conversation.tenantId === currentUserId ? conversation.ownerName : conversation.tenantName

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherName}</p>
          <p className="text-xs text-gray-400 truncate">{conversation.listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">
            Envoyez un premier message !
          </p>
        ) : (
          allMessages.map((msg, i) => {
            const isMine = msg.senderId === currentUserId
            const showDate =
              i === 0 ||
              formatDate(allMessages[i - 1].createdAt) !== formatDate(msg.createdAt)
            return (
              <div key={msg.id}>
                {showDate && (
                  <p className="text-center text-xs text-gray-400 my-2">
                    {formatDate(msg.createdAt)}
                  </p>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm break-words ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                    <span className={`block text-right text-[10px] mt-0.5 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Votre message…"
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-3 py-1.5 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { isAuthenticated, user, accessToken } = useAuthStore()
  const { open, setOpen, activeConvId, setActiveConvId } = useChatStore()

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatApi.getConversations,
    enabled: isAuthenticated && open,
    refetchInterval: open ? 10_000 : false,
  })

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null

  if (!isAuthenticated || !user || !accessToken) return null

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3.5 shadow-lg shadow-indigo-500/30 transition-colors"
        aria-label="Ouvrir le chat"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-80 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {activeConv ? 'Conversation' : 'Messages'}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-indigo-500 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
              {activeConv ? (
                <ConversationView
                  conversation={activeConv}
                  currentUserId={user.id}
                  accessToken={accessToken}
                  onBack={() => setActiveConvId(null)}
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                      <MessageCircle className="h-10 w-10 text-gray-200 mb-3" />
                      <p className="text-sm font-medium text-gray-600">Aucune conversation</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ouvrez une annonce et contactez le propriétaire pour démarrer.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {conversations.map((conv) => {
                        const isTenant = conv.tenantId === user.id
                        const otherName = isTenant ? conv.ownerName : conv.tenantName
                        return (
                          <li key={conv.id}>
                            <button
                              onClick={() => setActiveConvId(conv.id)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{otherName}</p>
                                  <p className="text-xs text-gray-400 truncate">{conv.listingTitle}</p>
                                  {conv.lastMessage && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                                  {formatDate(conv.updatedAt)}
                                </span>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
