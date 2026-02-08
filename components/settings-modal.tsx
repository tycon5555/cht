'use client'

import { X, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  notificationsEnabled: boolean
  onNotificationsChange: (enabled: boolean) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  notificationsEnabled,
  onNotificationsChange,
}: SettingsModalProps) {
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

            {/* Settings */}
            <div className="space-y-6">
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

              {/* Privacy */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Privacy & Security</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors text-sm">
                    Block List
                  </button>
                  <button className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors text-sm">
                    Data Export
                  </button>
                  <button className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors text-sm">
                    Change Password
                  </button>
                </div>
              </div>

              {/* About */}
              <div>
                <h3 className="font-semibold text-sm mb-3">About</h3>
                <div className="px-4 py-3 bg-input rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">
                    Messenger v1.0.0
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Premium messaging application built with Next.js
                  </p>
                </div>
              </div>
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
