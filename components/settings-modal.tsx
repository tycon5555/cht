'use client'

import { useState } from 'react'
import { X, Sun, Moon, EyeOff, Lock, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BlockedUser } from '@/lib/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  notificationsEnabled: boolean
  onNotificationsChange: (enabled: boolean) => void
  invisibleMode?: boolean
  onInvisibleModeChange?: (enabled: boolean) => void
  blockedUsers?: BlockedUser[]
  onUnblockUser?: (userId: string) => void
  closedChats?: string[]
  onReopenChat?: (chatId: string) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  notificationsEnabled,
  onNotificationsChange,
  invisibleMode = false,
  onInvisibleModeChange,
  blockedUsers = [],
  onUnblockUser,
  closedChats = [],
  onReopenChat,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'about'>('general')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              {(['general', 'privacy', 'about'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </div>

            {/* Settings Content */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {activeTab === 'general' && (
                <>
                  {/* Theme */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Appearance</h3>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onThemeChange('light')}
                        className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          theme === 'light'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span className="text-sm font-medium">Light</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onThemeChange('dark')}
                        className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span className="text-sm font-medium">Dark</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                    <div className="flex items-center justify-between p-3 bg-input rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium">Enable Notifications</p>
                        <p className="text-xs text-muted-foreground">Desktop & browser notifications</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNotificationsChange(!notificationsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationsEnabled ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <motion.span
                          animate={{
                            x: notificationsEnabled ? 20 : 2,
                          }}
                          className="inline-block h-5 w-5 transform rounded-full bg-white"
                        />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'privacy' && (
                <>
                  {/* Invisible Mode */}
                  <div>
                    <div className="flex items-center justify-between p-3 bg-input rounded-lg border border-border mb-4">
                      <div className="flex items-center gap-3">
                        <EyeOff className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Invisible Mode</p>
                          <p className="text-xs text-muted-foreground">Appear offline to everyone</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onInvisibleModeChange?.(!invisibleMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          invisibleMode ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <motion.span
                          animate={{
                            x: invisibleMode ? 20 : 2,
                          }}
                          className="inline-block h-5 w-5 transform rounded-full bg-white"
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Blocked Users */}
                  {blockedUsers && blockedUsers.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Blocked Users</h3>
                      <div className="space-y-2">
                        {blockedUsers.map((blocked) => (
                          <div
                            key={blocked.userId}
                            className="flex items-center justify-between p-3 bg-input rounded-lg border border-border"
                          >
                            <div>
                              <p className="text-sm text-foreground">User {blocked.userId}</p>
                              <p className="text-xs text-muted-foreground">
                                Blocked {new Date(blocked.blockedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onUnblockUser?.(blocked.userId)}
                              className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                            >
                              Unblock
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Closed Conversations */}
                  {closedChats && closedChats.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Closed Conversations</h3>
                      <div className="space-y-2">
                        {closedChats.map((chatId) => (
                          <div
                            key={chatId}
                            className="flex items-center justify-between p-3 bg-input rounded-lg border border-border"
                          >
                            <p className="text-sm text-foreground">Chat {chatId}</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onReopenChat?.(chatId)}
                              className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                            >
                              Reopen
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'about' && (
                <div>
                  <div className="p-4 bg-input rounded-lg border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Premium Messenger</p>
                        <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          A modern, secure messaging platform with advanced privacy and safety features.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Built with Next.js, React, TypeScript, and Tailwind CSS.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border mt-6 pt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
