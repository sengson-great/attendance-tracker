'use client';

import { motion } from 'framer-motion';
import { QrCode, Users, Clock, CheckCircle, Printer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Khmer translations
const translations = {
  // Hero section
  title: 'QR កូដតែមួយ',
  subtitle: 'សម្រាប់បុគ្គលិកទាំងអស់',
  description: 'បោះពុម្ព QR កូដតែមួយ។ ដាក់នៅច្រកចូល។ បុគ្គលិកស្កេន និងជ្រើសរើសឈ្មោះរបស់ពួកគេ។ រួចរាល់! មិនត្រូវការកម្មវិធី មិនត្រូវការពាក្យសម្ងាត់ មិនត្រូវការការបណ្តុះបណ្តាលទេ។',

  // Buttons
  tryDemo: 'សាកល្បងស្កេន',
  adminDashboard: 'ទំព័រអ្នកគ្រប់គ្រង',

  // QR section
  schoolEntranceQR: 'QR ច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន',
  oneCodeForAll: 'កូដតែមួយសម្រាប់បុគ្គលិកទាំងអស់',
  printQR: 'បោះពុម្ព QR',

  // How it works
  howItWorks: [
    {
      step: '១',
      title: 'បោះពុម្ព QR',
      desc: 'បោះពុម្ព QR កូដតែមួយ ហើយដាក់នៅច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន',
      icon: '🖨️'
    },
    {
      step: '២',
      title: 'បុគ្គលិកស្កេន',
      desc: 'បុគ្គលិកស្កេនជាមួយកាមេរ៉ាទូរស័ព្ទរបស់ពួកគេ',
      icon: '📱'
    },
    {
      step: '៣',
      title: 'ជ្រើសរើសឈ្មោះ',
      desc: 'ជ្រើសរើសឈ្មោះរបស់ពួកគេពីបញ្ជី - រួចរាល់!',
      icon: '✅'
    }
  ],

  // Stats
  stats: [
    { label: 'បុគ្គលិកសកម្ម', value: '៥០+' },
    { label: 'វត្តមានថ្ងៃនេះ', value: '៤២' },
    { label: 'មធ្យមពេលវេលា', value: '៣ វិនាទី' },
    { label: 'ក្រុមហ៊ុន ឬស្ថាប័នដែលប្រើ', value: '១០០+' }
  ]
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-6xl font-bold mb-6">
            <span className="text-blue-600 bg-clip-text">
              {translations.title}
            </span>
            <br />
            <br />
            <span className="text-gray-400 bg-clip-text">
              {translations.subtitle}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {translations.description}
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/scan">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                {translations.tryDemo}
              </button>
            </Link>
            <Link href="/admin/login">
              <button className="border-2 border-gray-300 px-8 py-4 rounded-xl text-gray-900 hover:text-gray-600 text-lg font-semibold hover:border-blue-600 transition-all">
                {translations.adminDashboard}
              </button>
            </Link>
          </div>
        </motion.div>

        {/* QR Code Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-16 flex justify-center"
        >
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-8 rounded-2xl">
              <QrCode className="w-64 h-64 mx-auto text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mt-6">{translations.schoolEntranceQR}</h2>
            <p className="text-gray-500 mb-4">{translations.oneCodeForAll}</p>
            <button className="flex items-center justify-center space-x-2 text-blue-600 mx-auto">
              <Printer className="h-5 w-5" />
              <span>{translations.printQR}</span>
            </button>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {translations.howItWorks.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center shadow-lg"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {translations.stats.map((stat, i) => {
              // Get the appropriate icon for each stat
              const IconComponent = i === 0 ? Users : i === 1 ? CheckCircle : i === 2 ? Clock : Users;

              return (
                <div key={i} className="text-center">
                  <IconComponent className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-black">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}