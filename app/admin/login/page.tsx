'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Eye, EyeOff, AlertCircle, Phone, X, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Khmer translations
const translations = {
  title: 'ចូលប្រើទំព័រអ្នកគ្រប់គ្រង',
  subtitle: 'បញ្ចូល PIN ដើម្បីចូលប្រើ',
  pinLabel: 'PIN ៤ ខ្ទង់',
  loginButton: 'ចូលប្រើ',
  verifying: 'កំពុងផ្ទៀងផ្ទាត់...',
  errorInvalid: 'PIN មិនត្រឹមត្រូវ។ នៅសល់ {{attempts}} ដង។',
  errorLocked: 'បញ្ចូលខុសច្រើនពេក។ សូមរង់ចាំ {{minutes}} នាទីទៀត។',
  showPin: 'បង្ហាញ PIN',
  hidePin: 'លាក់ PIN',
  backToHome: 'ត្រឡប់ទៅទំព័រដើម',
  attemptsRemaining: 'នៅសល់ {{attempts}} ដង',
  loading: 'កំពុងផ្ទុក...',
  serverError: 'មានបញ្ហាក្នុងការតភ្ជាប់។ សូមព្យាយាមម្តងទៀត។',
  retry: 'សូមព្យាយាមម្តងទៀត',
  forgotPin: 'ភ្លេចលេខកូដ PIN?',
  contactDevTitle: 'ទាក់ទងអ្នកអភិវឌ្ឍន៍ (Developer)',
  contactDevDesc: 'សូមទាក់ទងអ្នកអភិវឌ្ឍន៍ដើម្បីទទួលបាន ឬបង្កើតលេខកូដ PIN ថ្មីឡើងវិញ។',
  phoneNumber: '០៩៦ ៨០៥ ៣៩៩៧',
  copyNumber: 'ចម្លងលេខទូរស័ព្ទ',
  copiedNumber: 'បានចម្លង!',
  callDev: 'ទូរស័ព្ទទៅកាន់អ្នកអភិវឌ្ឍន៍',
  close: 'បិទ'
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export default function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState<number | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('0968053997');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Load attempts from storage
    const storedAttempts = localStorage.getItem('admin_attempts');
    if (storedAttempts) {
      const { count, timestamp } = JSON.parse(storedAttempts);
      const timeSince = Date.now() - timestamp;
      const lockoutMs = LOCKOUT_MINUTES * 60 * 1000;
      
      if (timeSince < lockoutMs) {
        setAttempts(count);
        if (count >= MAX_ATTEMPTS) {
          setIsLocked(true);
          const remainingMinutes = Math.ceil((lockoutMs - timeSince) / 60000);
          setLockTimer(remainingMinutes);
        }
      } else {
        localStorage.removeItem('admin_attempts');
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (isLocked && lockTimer && lockTimer > 0) {
      const timer = setTimeout(() => {
        setLockTimer(lockTimer - 1);
        if (lockTimer <= 1) {
          setIsLocked(false);
          setAttempts(0);
          localStorage.removeItem('admin_attempts');
          setError(null);
        }
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, lockTimer]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    if (isLocked) {
      return;
    }

    const enteredPin = pin.join('');
    
    if (enteredPin.length !== 4) {
      setError('សូមបញ្ចូល PIN ៤ ខ្ទង់');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Successful login
        localStorage.removeItem('admin_attempts');
        router.push('/admin');
        router.refresh();
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        localStorage.setItem('admin_attempts', JSON.stringify({
          count: newAttempts,
          timestamp: Date.now()
        }));

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockTimer(LOCKOUT_MINUTES);
          setError(translations.errorLocked.replace('{{minutes}}', LOCKOUT_MINUTES.toString()));
        } else {
          setError(translations.errorInvalid.replace('{{attempts}}', (MAX_ATTEMPTS - newAttempts).toString()));
        }
        
        // Clear PIN input
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(translations.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{translations.title}</h1>
          <p className="text-gray-500 mt-2">{translations.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {translations.pinLabel}
            </label>
            <div className="flex justify-center space-x-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type={showPin ? 'text' : 'password'}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading || isLocked}
                  className="w-14 h-14 text-center text-2xl text-black font-bold border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Show/Hide PIN Toggle & Forgot PIN */}
          <div className="flex justify-between items-center text-sm px-1">
            <button
              onClick={() => setShowPin(!showPin)}
              type="button"
              className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              {showPin ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>{translations.hidePin}</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>{translations.showPin}</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowForgotPassword(true)}
              type="button"
              className="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {translations.forgotPin}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Attempts Remaining */}
          {!isLocked && attempts > 0 && (
            <p className="text-center text-sm text-orange-600">
              {translations.attemptsRemaining.replace('{{attempts}}', (MAX_ATTEMPTS - attempts).toString())}
            </p>
          )}

          {/* Lock Timer */}
          {isLocked && lockTimer !== null && (
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg text-center">
              <Lock className="h-5 w-5 mx-auto mb-1" />
              <p className="text-sm font-medium">
                {translations.errorLocked.replace('{{minutes}}', lockTimer.toString())}
              </p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || isLocked}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {translations.verifying}
              </div>
            ) : (
              translations.loginButton
            )}
          </button>

          {/* Back to Home Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← {translations.backToHome}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPassword(false)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-xs"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative z-10 overflow-hidden border border-gray-100"
            >
              {/* Decorative top pattern */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
              
              {/* Close Button */}
              <button
                onClick={() => setShowForgotPassword(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100 cursor-pointer animate-none"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mt-3">
                {/* Icon */}
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                  <Phone className="h-8 w-8 text-indigo-600" />
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {translations.contactDevTitle}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {translations.contactDevDesc}
                </p>

                {/* Phone Number Display Box */}
                <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
                      លេខទូរស័ព្ទអ្នកអភិវឌ្ឍន៍
                    </span>
                    <a
                      href="tel:0968053997"
                      className="text-xl font-extrabold text-indigo-950 tracking-wide hover:text-indigo-700 transition-colors animate-none"
                    >
                      {translations.phoneNumber}
                    </a>
                  </div>
                  
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyPhone}
                    className="p-2 bg-white hover:bg-indigo-100 border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-700 rounded-lg shadow-xs transition-all cursor-pointer"
                    title={translations.copyNumber}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <a
                    href="tel:0968053997"
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{translations.callDev}</span>
                  </a>
                  
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold border border-gray-200 transition-colors cursor-pointer"
                  >
                    {translations.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}