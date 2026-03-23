'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Save, RefreshCw,
  ArrowLeft, Crosshair, Map, Globe, AlertCircle,
  CheckCircle, Loader, Settings, Clock, Bell,
  Send, MessageSquare, Lock, Shield, Eye, EyeOff,
  Key, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Khmer translations
const translations = {
  pageTitle: 'ការកំណត់ប្រព័ន្ធ',
  pageSubtitle: 'គ្រប់គ្រងការកំណត់ទាំងអស់ក្នុងមួយកន្លែង',

  // Tabs
  tabLocation: 'ទីតាំង',
  tabLate: 'ម៉ោងយឺត',
  tabTelegram: 'តេឡេក្រាម',
  tabSecurity: 'សន្តិសុខ',

  // Location settings
  locationTitle: 'កំណត់ទីតាំងក្រុមហ៊ុន',
  locationSubtitle: 'កំណត់រង្វង់ទីតាំងសម្រាប់ការផ្ទៀងផ្ទាត់ GPS',
  schoolName: 'ឈ្មោះក្រុមហ៊ុន',
  schoolNamePlaceholder: 'បញ្ចូលឈ្មោះក្រុមហ៊ុន',
  latitude: 'រយៈទទឹង (Latitude)',
  latitudePlaceholder: 'ឧ. 11.5564',
  longitude: 'រយៈបណ្តោយ (Longitude)',
  longitudePlaceholder: 'ឧ. 104.9282',
  radius: 'កាំអនុញ្ញាត (ម៉ែត្រ)',
  radiusPlaceholder: 'ឧ. 100',
  radiusHelp: 'ចម្ងាយអតិបរមាពីក្រុមហ៊ុនដែលអនុញ្ញាតឱ្យចុះវត្តមាន',
  getCurrentLocation: 'ប្រើទីតាំងបច្ចុប្បន្ន',
  locating: 'កំពុងស្វែងរកទីតាំង...',

  // Late settings
  lateTitle: 'កំណត់ម៉ោងយឺត',
  lateSubtitle: 'កំណត់ពេលវេលាចាប់ផ្តើមការងារ និងច្បាប់សម្រាប់ការយឺត',
  startTime: 'ម៉ោងចាប់ផ្តើមការងារ',
  startTimeHelp: 'ពេលវេលាដែលក្រុមហ៊ុនចាប់ផ្តើមជាផ្លូវការ',
  gracePeriod: 'រយៈពេលអនុគ្រោះ (នាទី)',
  graceHelp: 'នាទីបន្ទាប់ពីម៉ោងចាប់ផ្តើម រាប់ថា "ទាន់ពេល"',
  currentRules: 'ច្បាប់បច្ចុប្បន្ន',
  onTimeRule: 'ទាន់ពេល',
  lateRule: 'យឺត',
  veryLateRule: 'យឺតខ្លាំង',
  minutesAfterStart: 'នាទីបន្ទាប់ពីចាប់ផ្តើម',

  // Telegram settings
  telegramTitle: 'ការកំណត់តេឡេក្រាម',
  telegramSubtitle: 'កំណត់ការជូនដំណឹងតាមរយៈ Telegram',
  enableTelegram: 'បើកប្រើតេឡេក្រាម',
  botToken: 'Bot Token',
  botTokenPlaceholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
  botTokenHelp: 'ទទួលបានពី @BotFather លើតេឡេក្រាម',
  chatId: 'Chat ID',
  chatIdPlaceholder: '-1234567890',
  chatIdHelp: 'ID របស់ Chat (អាចជាលេខអវិជ្ជមានសម្រាប់ក្រុម)',
  notifyWhen: 'ជូនដំណឹងនៅពេល',
  notifyOnTime: 'វត្តមានទាន់ពេល',
  notifyLate: 'វត្តមានយឺត',
  notifyVeryLate: 'វត្តមានយឺតខ្លាំង',
  testConnection: 'សាកល្បងការតភ្ជាប់',

  // Security settings
  securityTitle: 'សន្តិសុខប្រព័ន្ធ',
  securitySubtitle: 'កំណត់ PIN សម្រាប់ចូលប្រើទំព័រអ្នកគ្រប់គ្រង',
  currentPin: 'PIN បច្ចុប្បន្ន',
  currentPinPlaceholder: 'បញ្ចូល PIN បច្ចុប្បន្ន',
  newPin: 'PIN ថ្មី',
  newPinPlaceholder: 'បញ្ចូល PIN ថ្មី ៤ ខ្ទង់',
  confirmPin: 'បញ្ជាក់ PIN ថ្មី',
  confirmPinPlaceholder: 'បញ្ចូល PIN ថ្មីម្តងទៀត',
  changePin: 'ផ្លាស់ប្តូរ PIN',
  pinMismatch: 'PIN ថ្មីមិនត្រូវគ្នាទេ',
  pinLength: 'PIN ត្រូវមាន ៤ ខ្ទង់',
  pinChanged: 'បានផ្លាស់ប្តូរ PIN ដោយជោគជ័យ',
  pinIncorrect: 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ',
  enterPinToView: 'បញ្ចូល PIN ដើម្បីមើលការកំណត់',
  pinRequired: 'ត្រូវការ PIN',

  // Buttons
  saveSettings: 'រក្សាទុកការកំណត់',
  saving: 'កំពុងរក្សាទុក...',
  backToDashboard: 'ត្រឡប់ទៅទំព័រដើម',
  refresh: 'ធ្វើឱ្យស្រស់',
  test: 'សាកល្បង',

  // Messages
  loadSuccess: 'បានផ្ទុកការកំណត់ដោយជោគជ័យ',
  loadError: 'មិនអាចផ្ទុកការកំណត់បានទេ',
  saveSuccess: 'បានរក្សាទុកការកំណត់ដោយជោគជ័យ',
  saveError: 'មិនអាចរក្សាទុកការកំណត់បានទេ',
  locationSuccess: 'ទទួលបានទីតាំងបច្ចុប្បន្នដោយជោគជ័យ',
  locationError: 'មិនអាចទទួលបានទីតាំងបច្ចុប្បន្នទេ',
  locationDenied: 'សូមអនុញ្ញាតិឱ្យប្រើទីតាំង',
  telegramTestSent: 'សារសាកល្បងបានផ្ញើទៅកាន់តេឡេក្រាម!',
  telegramTestFailed: 'បរាជ័យក្នុងការផ្ញើសារសាកល្បង',

  // Validation
  requiredField: 'សូមបំពេញព័ត៌មាននេះ',
  invalidLatitude: 'សូមបញ្ចូលរយៈទទឹងឱ្យបានត្រឹមត្រូវ (ចន្លោះ -៩០ និង ៩០)',
  invalidLongitude: 'សូមបញ្ចូលរយៈបណ្តោយឱ្យបានត្រឹមត្រូវ (ចន្លោះ -១៨០ និង ១៨០)',
  invalidRadius: 'សូមបញ្ចូលកាំឱ្យបានត្រឹមត្រូវ (ចន្លោះ ១ និង ១០០០ ម៉ែត្រ)',

  // Help text
  helpTitle: 'របៀបកំណត់',
  helpStep1: '១. ចុច "ប្រើទីតាំងបច្ចុប្បន្ន" ដើម្បីទទួលបានទីតាំងរបស់អ្នក',
  helpStep2: '២. កែសម្រួលតម្លៃប្រសិនបើចាំបាច់',
  helpStep3: '៣. កំណត់កាំអនុញ្ញាត',
  helpStep4: '៤. ចុច "រក្សាទុកការកំណត់"',
  helpNote: 'ចំណាំ: ការកំណត់ទាំងអស់នឹងត្រូវបានអនុវត្តភ្លាមៗ'
};

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface SchoolSettings {
  id: number;
  school_name: string;
  latitude: number;
  longitude: number;
  allowed_radius: number;
  admin_pin: string;
  school_start_hour: number;
  school_start_minute: number;
  grace_period: number;
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_notify_on_time: boolean;
  telegram_notify_late: boolean;
  telegram_notify_very_late: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'location' | 'late' | 'telegram' | 'security'>('location');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState<SchoolSettings>({
    id: 1,
    school_name: '',
    latitude: 0,
    longitude: 0,
    allowed_radius: 100,
    admin_pin: '1234',
    school_start_hour: 7,
    school_start_minute: 0,
    grace_period: 5,
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_notify_on_time: false,
    telegram_notify_late: true,
    telegram_notify_very_late: true
  });

  // PIN change states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChanging, setPinChanging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<{
    school_name?: string;
    latitude?: string;
    longitude?: string;
    allowed_radius?: string;
  }>({});

  useEffect(() => {
    loadSettings();
    
    // Check if already authenticated in this session
    const sessionAuth = sessionStorage.getItem('settings_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          id: 1,
          school_name: data.school_name || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          allowed_radius: data.allowed_radius || 100,
          admin_pin: data.admin_pin,
          school_start_hour: data.school_start_hour || 7,
          school_start_minute: data.school_start_minute || 0,
          grace_period: data.grace_period || 5,
          telegram_enabled: data.telegram_enabled || false,
          telegram_bot_token: data.telegram_bot_token || '',
          telegram_chat_id: data.telegram_chat_id || '',
          telegram_notify_on_time: data.telegram_notify_on_time || false,
          telegram_notify_late: data.telegram_notify_late !== false,
          telegram_notify_very_late: data.telegram_notify_very_late !== false
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: translations.loadError });
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = () => {
    const enteredPin = pinInput.join('');
    if (enteredPin === settings.admin_pin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('settings_auth', 'true');
      setPinError(null);
    } else {
      setPinError('PIN មិនត្រឹមត្រូវ');
      setPinInput(['', '', '', '']);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pinInput];
    newPin[index] = value;
    setPinInput(newPin);
    setPinError(null);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!settings.school_name.trim()) {
      newErrors.school_name = translations.requiredField;
    }

    if (isNaN(settings.latitude) || settings.latitude < -90 || settings.latitude > 90) {
      newErrors.latitude = translations.invalidLatitude;
    }

    if (isNaN(settings.longitude) || settings.longitude < -180 || settings.longitude > 180) {
      newErrors.longitude = translations.invalidLongitude;
    }

    if (isNaN(settings.allowed_radius) || settings.allowed_radius < 1 || settings.allowed_radius > 1000) {
      newErrors.allowed_radius = translations.invalidRadius;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveSettings = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('school_settings')
        .upsert({
          id: 1,
          school_name: settings.school_name,
          latitude: settings.latitude,
          longitude: settings.longitude,
          allowed_radius: settings.allowed_radius,
          school_start_hour: settings.school_start_hour,
          school_start_minute: settings.school_start_minute,
          grace_period: settings.grace_period,
          telegram_enabled: settings.telegram_enabled,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_chat_id: settings.telegram_chat_id,
          telegram_notify_on_time: settings.telegram_notify_on_time,
          telegram_notify_late: settings.telegram_notify_late,
          telegram_notify_very_late: settings.telegram_notify_very_late,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: translations.saveSuccess });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: translations.saveError });
    } finally {
      setSaving(false);
    }
  };

  const changePin = async () => {
    if (newPin.length !== 4) {
      setMessage({ type: 'error', text: translations.pinLength });
      return;
    }
    if (newPin !== confirmPin) {
      setMessage({ type: 'error', text: translations.pinMismatch });
      return;
    }

    setPinChanging(true);
    try {
      const { error } = await supabase
        .from('school_settings')
        .update({ admin_pin: newPin })
        .eq('id', 1);

      if (error) throw error;

      setSettings({ ...settings, admin_pin: newPin });
      setMessage({ type: 'success', text: translations.pinChanged });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      setMessage({ type: 'error', text: translations.saveError });
    } finally {
      setPinChanging(false);
    }
  };

  const getCurrentLocation = () => {
    setLocating(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: translations.locationError });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings({
          ...settings,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setMessage({ type: 'success', text: translations.locationSuccess });
        setLocating(false);
      },
      (error) => {
        console.error('Location error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setMessage({ type: 'error', text: translations.locationDenied });
        } else {
          setMessage({ type: 'error', text: translations.locationError });
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const testTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      setMessage({ type: 'error', text: 'សូមកំណត់ Bot Token និង Chat ID ជាមុន' });
      return;
    }

    setTestingTelegram(true);
    try {
      const response = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: settings.telegram_chat_id,
          botToken: settings.telegram_bot_token,
          message: '*✅ សាកល្បងការតភ្ជាប់តេឡេក្រាម*\n\n📊 *ប្រព័ន្ធ:* ការកំណត់\n✨ *ស្ថានភាព:* ដំណើរការល្អ!'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: translations.telegramTestSent });
      } else {
        setMessage({ type: 'error', text: translations.telegramTestFailed });
      }
    } catch (error) {
      setMessage({ type: 'error', text: translations.telegramTestFailed });
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">កំពុងផ្ទុក...</p>
        </div>
      </div>
    );
  }

  // PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
        >
          <div className="text-center mb-8">
            <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{translations.enterPinToView}</h2>
            <p className="text-gray-500 mt-2">{translations.pinRequired}</p>
          </div>

          <div className="flex justify-center space-x-3 mb-6">
            {pinInput.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type={showPin ? 'text' : 'password'}
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowPin(!showPin)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {showPin ? 'លាក់ PIN' : 'បង្ហាញ PIN'}
            </button>
          </div>

          {pinError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{pinError}</span>
            </div>
          )}

          <button
            onClick={handlePinSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            ចូលប្រើ
          </button>

          <div className="mt-6 text-center">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">
              ← {translations.backToDashboard}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{translations.pageTitle}</h1>
                <p className="text-sm text-gray-500">{translations.pageSubtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-1 bg-white rounded-xl p-1 mb-6 shadow-sm">
            {[
              { id: 'location', icon: MapPin, label: translations.tabLocation },
              { id: 'late', icon: Clock, label: translations.tabLate },
              { id: 'telegram', icon: Send, label: translations.tabTelegram },
              { id: 'security', icon: Shield, label: translations.tabSecurity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Message Alert */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}

          {/* Location Settings Tab */}
          {activeTab === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-2 flex items-center text-black">
                <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
                {translations.locationTitle}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{translations.locationSubtitle}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.schoolName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.school_name}
                    onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                    className="w-full border text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder={translations.schoolNamePlaceholder}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations.latitude} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={settings.latitude}
                      onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border rounded-lg text-black px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                      placeholder={translations.latitudePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations.longitude} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={settings.longitude}
                      onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border rounded-lg text-black px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                      placeholder={translations.longitudePlaceholder}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.radius} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.allowed_radius}
                    onChange={(e) => setSettings({ ...settings, allowed_radius: parseInt(e.target.value) || 100 })}
                    className="w-full border rounded-lg text-black px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder={translations.radiusPlaceholder}
                  />
                  <p className="mt-1 text-xs text-gray-500">{translations.radiusHelp}</p>
                </div>

                <button
                  onClick={getCurrentLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {locating ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      {translations.locating}
                    </>
                  ) : (
                    <>
                      <Crosshair className="h-4 w-4 mr-2" />
                      {translations.getCurrentLocation}
                    </>
                  )}
                </button>
              </div>

                       <h3 className="font-semibold text-blue-800 my-3">{translations.helpTitle}</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>{translations.helpStep1}</p>
            <p>{translations.helpStep2}</p>
            <p>{translations.helpStep3}</p>
            <p>{translations.helpStep4}</p>
            <p className="mt-3 text-xs text-blue-600">{translations.helpNote}</p>
          </div>
            </motion.div>
          )}

          {/* Late Settings Tab */}
          {activeTab === 'late' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-2 flex items-center text-black">
                <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                {translations.lateTitle}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{translations.lateSubtitle}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.startTime}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={settings.school_start_hour}
                      onChange={(e) => setSettings({ ...settings, school_start_hour: parseInt(e.target.value) || 7 })}
                      className="w-20 border rounded-lg px-3 py-2 text-center text-black"
                    />
                    <span className="text-gray-500 self-center">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={settings.school_start_minute}
                      onChange={(e) => setSettings({ ...settings, school_start_minute: parseInt(e.target.value) || 0 })}
                      className="w-20 border rounded-lg px-3 py-2 text-center text-black"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{translations.startTimeHelp}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.gracePeriod}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.grace_period}
                    onChange={(e) => setSettings({ ...settings, grace_period: parseInt(e.target.value) || 5 })}
                    className="w-full border rounded-lg px-4 py-2 text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">{translations.graceHelp}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">{translations.currentRules}</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• {translations.onTimeRule}: មុនម៉ោង {settings.school_start_hour}:{settings.school_start_minute.toString().padStart(2, '0')} + {settings.grace_period} {translations.minutesAfterStart}</li>
                    <li>• {translations.lateRule}: {settings.grace_period + 1} - 30 {translations.minutesAfterStart}</li>
                    <li>• {translations.veryLateRule}: 31+ {translations.minutesAfterStart}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Telegram Settings Tab */}
          {activeTab === 'telegram' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-2 flex items-center text-black">
                <Send className="h-5 w-5 text-indigo-600 mr-2" />
                {translations.telegramTitle}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{translations.telegramSubtitle}</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{translations.enableTelegram}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.botToken}
                  </label>
                  <input
                    type="text"
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-black"
                    placeholder={translations.botTokenPlaceholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{translations.botTokenHelp}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.chatId}
                  </label>
                  <input
                    type="text"
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 text-black"
                    placeholder={translations.chatIdPlaceholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{translations.chatIdHelp}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 text-black">{translations.notifyWhen}</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.telegram_notify_on_time}
                        onChange={(e) => setSettings({ ...settings, telegram_notify_on_time: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{translations.notifyOnTime}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.telegram_notify_late}
                        onChange={(e) => setSettings({ ...settings, telegram_notify_late: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{translations.notifyLate}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.telegram_notify_very_late}
                        onChange={(e) => setSettings({ ...settings, telegram_notify_very_late: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{translations.notifyVeryLate}</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={testTelegram}
                  disabled={testingTelegram}
                  className="w-full flex items-center justify-center px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {testingTelegram ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      {translations.saving}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {translations.testConnection}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-2 flex items-center text-black">
                <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                {translations.securityTitle}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{translations.securitySubtitle}</p>

              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-700">PIN នេះប្រើសម្រាប់ចូលប្រើទំព័រកំណត់ និងទំព័រអ្នកគ្រប់គ្រង</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.currentPin}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-gray-500"
                    placeholder={translations.currentPinPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.newPin}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-gray-500"
                    placeholder={translations.newPinPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.confirmPin}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-gray-500"
                    placeholder={translations.confirmPinPlaceholder}
                  />
                </div>

                <button
                  onClick={changePin}
                  disabled={pinChanging}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {pinChanging ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      {translations.saving}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {translations.changePin}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Save Button for Location/Late/Telegram tabs */}
          {activeTab !== 'security' && (
            <div className="mt-6">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    {translations.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {translations.saveSettings}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Back to Dashboard Link */}
          <div className="mt-6 text-center">
            <Link
              href="/admin"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← {translations.backToDashboard}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}