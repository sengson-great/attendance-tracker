'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
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
  errorFetchingPin: 'មិនអាចផ្ទុក PIN បានទេ។ សូមពិនិត្យការតភ្ជាប់។',
  pinNotFound: 'មិនមាន PIN ក្នុងប្រព័ន្ធ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។',
  databaseError: 'កំហុសប្រព័ន្ធទិន្នន័យ',
  retry: 'សូមព្យាយាមម្តងទៀត'
};

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [correctPin, setCorrectPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load admin PIN from database with detailed logging
  useEffect(() => {
    const loadAdminPin = async () => {
      console.log('🔵 Loading admin PIN from database...');
      console.log('🔵 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      try {
        const { data, error, status, statusText } = await supabase
          .from('school_settings')
          .select('admin_pin, id, school_name')
          .eq('id', 1)
          .maybeSingle();

        console.log('📥 Supabase Response:');
        console.log('  - Status:', status);
        console.log('  - Status Text:', statusText);
        console.log('  - Error:', error);
        console.log('  - Data:', data);

        if (error) {
          console.error('❌ Database error:', error);
          setDbError(`${translations.databaseError}: ${error.message}`);
          setError(translations.errorFetchingPin);
          setCorrectPin(null);
        } else if (!data) {
          console.log('⚠️ No data found for id=1 in school_settings table');
          setDbError(translations.pinNotFound);
          setError(translations.pinNotFound);
          setCorrectPin(null);
        } else {
          console.log('✅ PIN loaded successfully:', data.admin_pin);
          console.log('  - School name:', data.school_name);
          console.log('  - Record ID:', data.id);
          setCorrectPin(data.admin_pin);
          setDbError(null);
        }
      } catch (err) {
        console.error('❌ Unexpected error loading PIN:', err);
        setDbError(err instanceof Error ? err.message : 'Unknown error');
        setError(translations.errorFetchingPin);
        setCorrectPin(null);
      } finally {
        setIsLoading(false);
        console.log('🏁 PIN loading completed. Correct PIN:', correctPin ? 'Set' : 'Not set');
      }
    };

    loadAdminPin();
  }, []);

  // Check if already logged in
  useEffect(() => {
    console.log('🔍 Checking existing session...');
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      const session = JSON.parse(adminSession);
      console.log('  - Session found, expires:', new Date(session.expires));
      if (session.expires > Date.now()) {
        console.log('  - Session valid, redirecting to admin');
        router.push('/admin');
      } else {
        console.log('  - Session expired, removing');
        localStorage.removeItem('admin_session');
      }
    } else {
      console.log('  - No session found');
    }

    // Load attempts from storage
    const storedAttempts = localStorage.getItem('admin_attempts');
    if (storedAttempts) {
      const { count, timestamp } = JSON.parse(storedAttempts);
      const timeSince = Date.now() - timestamp;
      const lockoutMs = LOCKOUT_MINUTES * 60 * 1000;
      
      console.log(`  - Attempts: ${count}, Time since last attempt: ${Math.floor(timeSince / 1000)}s`);
      
      if (timeSince < lockoutMs) {
        setAttempts(count);
        if (count >= MAX_ATTEMPTS) {
          setIsLocked(true);
          const remainingMinutes = Math.ceil((lockoutMs - timeSince) / 60000);
          setLockTimer(remainingMinutes);
          console.log(`  - Account locked for ${remainingMinutes} minutes`);
        }
      } else {
        console.log('  - Clearing old attempts');
        localStorage.removeItem('admin_attempts');
      }
    }
  }, [router]);

  // Countdown timer for lockout
  useEffect(() => {
    if (isLocked && lockTimer && lockTimer > 0) {
      const timer = setTimeout(() => {
        setLockTimer(lockTimer - 1);
        if (lockTimer <= 1) {
          console.log('🔓 Lockout period ended');
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
      console.log('⛔ Attempt blocked - account locked');
      return;
    }

    const enteredPin = pin.join('');
    console.log('🔑 PIN entered:', enteredPin);
    
    if (enteredPin.length !== 4) {
      setError('សូមបញ្ចូល PIN ៤ ខ្ទង់');
      return;
    }

    setLoading(true);

    try {
      if (correctPin === null) {
        console.log('❌ Cannot verify - PIN not loaded');
        setError(translations.errorFetchingPin);
        setLoading(false);
        return;
      }

      console.log(`🔐 Verifying PIN: entered=${enteredPin}, correct=${correctPin}`);
      
      if (enteredPin === correctPin) {
        // Successful login
        console.log('✅ PIN correct - creating session');
        const session = {
          authenticated: true,
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        };
        localStorage.setItem('admin_session', JSON.stringify(session));
        localStorage.removeItem('admin_attempts');
        console.log('📝 Session created, redirecting...');
        router.push('/admin');
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        console.log(`❌ PIN incorrect - attempt ${newAttempts}/${MAX_ATTEMPTS}`);
        setAttempts(newAttempts);
        
        localStorage.setItem('admin_attempts', JSON.stringify({
          count: newAttempts,
          timestamp: Date.now()
        }));

        if (newAttempts >= MAX_ATTEMPTS) {
          console.log('🔒 Max attempts reached - locking account');
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
      console.error('💥 Login error:', error);
      setError('មានបញ្ហាក្នុងការតភ្ជាប់។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{translations.loading}</p>
        </div>
      </div>
    );
  }

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
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && dbError && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left">
              <p className="font-mono text-red-600">Debug: {dbError}</p>
              <p className="font-mono text-gray-500 mt-1">PIN Loaded: {correctPin ? 'Yes' : 'No'}</p>
            </div>
          )}
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
                  disabled={loading || isLocked || correctPin === null}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                  autoFocus={index === 0 && correctPin !== null}
                />
              ))}
            </div>
          </div>

          {/* Show/Hide PIN Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowPin(!showPin)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
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
          {!isLocked && attempts > 0 && correctPin !== null && (
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
            disabled={loading || isLocked || correctPin === null}
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

          {/* Retry button if PIN not loaded */}
          {correctPin === null && !isLoading && (
            <button
              onClick={() => window.location.reload()}
              className="w-full text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              {translations.retry}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}