'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Smartphone, LogOut, Check } from 'lucide-react'
import type { Device } from '@/lib/types'

interface DevicesModalProps {
  isOpen: boolean
  onClose: () => void
  devices: Device[]
  onLogoutDevice: (deviceId: string) => void
  onLogoutAll: () => void
}

export function DevicesModal({
  isOpen,
  onClose,
  devices,
  onLogoutDevice,
  onLogoutAll,
}: DevicesModalProps) {
  const [confirmLogout, setConfirmLogout] = useState<string | null>(null)
  const [loggedOut, setLoggedOut] = useState<Set<string>>(new Set())

  const currentDevice = devices.find((d) => d.isCurrent)
  const otherDevices = devices.filter((d) => !d.isCurrent)

  const getDeviceIcon = (platform: string) => {
    if (['ios', 'android'].includes(platform)) {
      return <Smartphone className="w-5 h-5" />
    }
    return <Monitor className="w-5 h-5" />
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleLogout = (deviceId: string) => {
    setLoggedOut((prev) => new Set(prev).add(deviceId))
    setTimeout(() => {
      onLogoutDevice(deviceId)
      setConfirmLogout(null)
    }, 800)
  }

  const handleLogoutAll = () => {
    otherDevices.forEach((device) => {
      handleLogout(device.id)
    })
    setConfirmLogout(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Devices</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {/* Current Device */}
              {currentDevice && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Current Device
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border-2 border-primary rounded-lg bg-primary/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          {getDeviceIcon(currentDevice.platform)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{currentDevice.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {formatLastActive(currentDevice.lastActive)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Check className="w-3 h-3 text-green-500" />
                            <p className="text-xs text-green-600">Active now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Other Devices */}
              {otherDevices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Other Devices ({otherDevices.length})
                  </p>
                  <div className="space-y-2">
                    {otherDevices.map((device, idx) => (
                      <motion.div
                        key={device.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 border border-border rounded-lg transition-colors ${
                          loggedOut.has(device.id) ? 'bg-destructive/10 border-destructive/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-muted rounded-lg">
                              {getDeviceIcon(device.platform)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{device.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Last active: {formatLastActive(device.lastActive)}
                              </p>
                            </div>
                          </div>

                          {loggedOut.has(device.id) ? (
                            <div className="flex items-center gap-1 px-3 py-1 bg-destructive/10 rounded">
                              <Check className="w-3 h-3 text-destructive" />
                              <span className="text-xs text-destructive font-medium">Logged out</span>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setConfirmLogout(device.id)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <LogOut className="w-4 h-4 text-destructive" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {otherDevices.length === 0 && (
                <div className="p-8 text-center">
                  <Smartphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No other devices active</p>
                </div>
              )}
            </div>

            {/* Confirmation Modal */}
            {confirmLogout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 border border-destructive/30 bg-destructive/5 rounded-lg"
              >
                <p className="text-sm font-semibold mb-3">Log out from device?</p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmLogout(null)}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLogout(confirmLogout)}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 text-sm"
                  >
                    Log Out
                  </motion.button>
                </div>

                {otherDevices.length > 1 && confirmLogout === 'all' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogoutAll}
                    className="w-full mt-2 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm"
                  >
                    Log Out From All Other Devices
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Log Out All Button */}
            {otherDevices.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfirmLogout('all')}
                className="w-full mt-6 py-2 border border-destructive/30 text-destructive hover:bg-destructive/5 rounded-lg font-semibold transition-colors"
              >
                Log Out From All Other Devices
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full mt-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
