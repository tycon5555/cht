'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, MessageSquare, AlertCircle, Settings, BarChart3, Shield, Zap } from 'lucide-react'
import type { AnalyticsData, User, Report } from '@/lib/types'

interface AdminDashboardProps {
  isOpen: boolean
  onClose: () => void
  analytics: AnalyticsData
  users: User[]
  reports: Report[]
  onSuspendUser?: (userId: string) => void
  onBanUser?: (userId: string) => void
}

export function AdminDashboard({
  isOpen,
  onClose,
  analytics,
  users,
  reports,
  onSuspendUser,
  onBanUser,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'settings'>('overview')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: AlertCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

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
            className="bg-card rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              </div>
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
            <div className="flex gap-1 p-4 border-b border-border bg-muted/50 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {[
                      { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'blue' },
                      { label: 'Active Today', value: analytics.activeUsersToday, icon: Zap, color: 'green' },
                      { label: 'Messages Sent', value: analytics.totalMessagesSent, icon: MessageSquare, color: 'purple' },
                      { label: 'Active Groups', value: analytics.activeGroups, icon: Users, color: 'orange' },
                      { label: 'Reports', value: analytics.reportsSubmitted, icon: AlertCircle, color: 'red' },
                      { label: 'Suspended', value: analytics.suspendedUsers, icon: Shield, color: 'yellow' },
                    ].map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border border-border rounded-lg bg-${stat.color}-500/5 border-${stat.color}-500/20`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">{stat.label}</p>
                            <p className="text-3xl font-bold mt-1">{stat.value}</p>
                          </div>
                          <stat.icon className={`w-8 h-8 text-${stat.color}-500 opacity-30`} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {users.slice(0, 10).map((user, idx) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.suspended && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-700 text-xs rounded font-semibold">
                                Suspended
                              </span>
                            )}
                            {user.banned && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-700 text-xs rounded font-semibold">
                                Banned
                              </span>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedUser(user.id)}
                              className="px-3 py-1 text-xs bg-muted hover:bg-primary/20 rounded transition-colors"
                            >
                              Actions
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'reports' && (
                  <motion.div
                    key="reports"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {reports.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground">No reports at this time</p>
                      </div>
                    ) : (
                      reports.slice(0, 10).map((report, idx) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">User {report.reportedUserId}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                Reason: {report.reason}
                              </p>
                              {report.description && (
                                <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1 text-xs bg-green-500/20 text-green-700 hover:bg-green-500/30 rounded transition-colors"
                              >
                                Dismiss
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1 text-xs bg-red-500/20 text-red-700 hover:bg-red-500/30 rounded transition-colors"
                              >
                                Ban
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {[
                      { label: 'Enable Read Receipts', description: 'Show who read messages' },
                      { label: 'Allow Disappearing Messages', description: 'Permit message expiration' },
                      { label: 'Enable Message Effects', description: 'Allow confetti, sparkle effects' },
                      { label: 'Require Email Verification', description: 'Mandate verification before chat' },
                    ].map((setting, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 border border-border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm">{setting.label}</p>
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                          <motion.span className="inline-block h-5 w-5 transform rounded-full bg-primary" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
