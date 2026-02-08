'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Check, ArrowRight } from 'lucide-react'

interface VerificationModalProps {
  isOpen: boolean
  onVerify: (method: 'phone' | 'email') => void
}

export function VerificationModal({ isOpen, onVerify }: VerificationModalProps) {
  const [step, setStep] = useState<'method' | 'phone' | 'email'>('method')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)

  const handlePhoneVerify = () => {
    setStep('phone')
  }

  const handleEmailVerify = () => {
    setStep('email')
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
  }

  const handleOtpSubmit = () => {
    if (otp.join('') === '123456') {
      setVerified(true)
      setTimeout(() => {
        onVerify('phone')
      }, 1500)
    }
  }

  const handleEmailSubmit = () => {
    if (email.includes('@')) {
      setVerified(true)
      setTimeout(() => {
        onVerify('email')
      }, 1500)
    }
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
            className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl"
          >
            {step === 'method' && (
              <>
                <h2 className="text-2xl font-bold mb-2">Verify Your Account</h2>
                <p className="text-muted-foreground mb-8">Choose a verification method to continue</p>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePhoneVerify}
                    className="w-full p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-3"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Phone Number</p>
                      <p className="text-xs text-muted-foreground">Verify via OTP</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEmailVerify}
                    className="w-full p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-3"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Email (OAuth)</p>
                      <p className="text-xs text-muted-foreground">Google / Apple Sign-in</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>
              </>
            )}

            {step === 'phone' && (
              <>
                <h2 className="text-2xl font-bold mb-2">Phone Verification</h2>
                <p className="text-muted-foreground mb-6">Enter your phone number</p>

                <div className="space-y-4">
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {phoneNumber && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-sm text-muted-foreground">Enter OTP sent to your phone</p>
                      <div className="flex gap-2 justify-between">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            className="w-10 h-10 text-center border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Demo: Enter 123456</p>
                    </motion.div>
                  )}

                  {verified ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2"
                    >
                      <Check className="w-5 h-5 text-green-500" />
                      <p className="text-sm text-green-600">Verification successful!</p>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOtpSubmit}
                      disabled={otp.join('').length < 6}
                      className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify
                    </motion.button>
                  )}

                  <button
                    onClick={() => setStep('method')}
                    className="w-full py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {step === 'email' && (
              <>
                <h2 className="text-2xl font-bold mb-2">Email Verification</h2>
                <p className="text-muted-foreground mb-6">Sign in with your email provider</p>

                <div className="space-y-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='50%25' y='50%25' dominantBaseline='middle' textAnchor='middle' fontSize='16' fill='%234285F4'%3EG%3C/text%3E%3C/svg%3E" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='50%25' y='50%25' dominantBaseline='middle' textAnchor='middle' fontSize='16' fill='%23000'%3E🍎%3C/text%3E%3C/svg%3E" alt="Apple" className="w-5 h-5" />
                    Continue with Apple
                  </motion.button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 bg-card text-muted-foreground">Or</span>
                  </div>
                </div>

                {verified ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 mb-4"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-600">Email verified!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEmailSubmit}
                      disabled={!email}
                      className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Email
                    </motion.button>
                  </div>
                )}

                <button
                  onClick={() => setStep('method')}
                  className="w-full py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors mt-3"
                >
                  Back
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
