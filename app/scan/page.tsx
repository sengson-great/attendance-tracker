'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, CheckCircle, XCircle, Search,
  Users, Clock, MapPin, Loader,
  AlertCircle, CameraOff, Navigation
} from 'lucide-react';
import { recordAttendanceAction, getPublicEmployeesAction, getPublicSchoolSettingsAction } from '../actions';

// Types
interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  emoji: string;
}

// Khmer translations
const translations = {
  appTitle: 'ប្រព័ន្ធចុះវត្តមានបុគ្គលិក',
  appSubtitle: 'ស្កេន QR នៅច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន',
  welcome: 'សូមស្វាគមន៍មកកាន់ក្រុមហ៊ុន ឬស្ថាប័ន',
  scanInstruction: 'ចុចប៊ូតុងខាងក្រោមដើម្បីស្កេន QR នៅច្រកចូល',
  startCamera: 'ចាប់ផ្តើមថត',
  scanning: 'កំពុងស្កេន...',
  selectYourName: 'ជ្រើសរើសឈ្មោះរបស់អ្នក',
  checkInComplete: 'ចុះវត្តមានជោគជ័យ!',
  error: 'កំហុស',
  ready: 'រួចរាល់',
  employeesFound: 'បុគ្គលិកត្រូវបានរកឃើញ',
  back: 'ត្រឡប់ក្រោយ',
  cancel: 'បោះបង់',
  tryAgain: 'ព្យាយាមម្តងទៀត',
  searchPlaceholder: 'ស្វែងរកឈ្មោះរបស់អ្នក...',
  noEmployeesFound: 'រកមិនឃើញបុគ្គលិកទេ',
  welcome_back: 'សូមស្វាគមន៍!',
  department: 'ដេប៉ាតឺម៉ង់',
  checkInTime: 'ម៉ោងចុះវត្តមាន',
  location: 'ទីតាំង',
  schoolEntrance: 'ច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន',
  checkInAnother: 'ចុះវត្តមានបុគ្គលិកផ្សេងទៀត',
  cameraAccessDenied: 'មិនអាចចូលប្រើកាមេរ៉ាបានទេ។ សូមអនុញ្ញាតិឱ្យប្រើកាមេរ៉ា។',
  noCamera: 'រកមិនឃើញកាមេរ៉ានៅលើឧបករណ៍នេះទេ។',
  invalidQR: 'QR មិនត្រឹមត្រូវ។ សូមស្កេន QR របស់ក្រុមហ៊ុន ឬស្ថាប័ន។',
  checkInFailed: 'ការចុះវត្តមានបរាជ័យ។ សូមព្យាយាមម្តងទៀត។',
  todayCheckins: 'វត្តមានថ្ងៃនេះ',
  pointCamera: 'ចង្អុលកាមេរ៉ាទៅកាន់ QR នៅច្រកចូល',
  centerQR: 'ដាក់ QR នៅចំកណ្តាលក្រឡា',
  haveNiceDay: 'សូមថ្ងៃល្អ!',
  onTime: 'ទាន់ពេល',
  late: 'យឺត',
  veryLate: 'យឺតខ្លាំង',
  lateBy: 'យឺត',
  minutes: 'នាទី',
  hours: 'ម៉ោង',
  initializingCamera: 'កំពុងរៀបចំកាមេរ៉ា...',
  cameraReady: 'កាមេរ៉ារួចរាល់',
  cameraError: 'កំហុសកាមេរ៉ា',
  // Location translations
  verifyingLocation: 'កំពុងផ្ទៀងផ្ទាត់ទីតាំង...',
  locationVerified: 'ទីតាំងត្រឹមត្រូវ',
  locationDenied: 'សូមអនុញ្ញាតិឱ្យប្រើទីតាំងដើម្បីចុះវត្តមាន',
  locationUnavailable: 'មិនអាចកំណត់ទីតាំងបានទេ',
  locationNotReady: 'ប្រព័ន្ធកំពុងរៀបចំទីតាំងសាលា។ សូមរង់ចាំបន្តិច ហើយព្យាយាមម្តងទៀត។',
  locationTimeout: 'សូមព្យាយាមម្តងទៀត',
  locationRequiresHttps: 'ទូរស័ព្ទរបស់អ្នកអាចប្រើទីតាំងបានតែនៅលើ HTTPS ឬ localhost ប៉ុណ្ណោះ។',
  allowLocation: 'អនុញ្ញាតទីតាំង',
  locationReadyToCheckIn: 'ទីតាំងរួចរាល់ សូមជ្រើសឈ្មោះដើម្បីចុះវត្តមាន',
  locationPermissionHelp: 'សូមចុចប៊ូតុងនេះមុន ជាពិសេសនៅលើ Safari ដើម្បីអនុញ្ញាតទីតាំង។',
  safariHelpTitle: 'មានបញ្ហាទីតាំងលើ Safari?',
  safariHelpBody: 'បើស្កេនពីកាមេរ៉ា iPhone ហើយ Safari មិនអនុញ្ញាតទីតាំង សូមធ្វើតាមជំហានខាងក្រោម។',
  safariStep1: 'ទៅកាន់ Settings > Privacy & Security > Location Services > Safari Websites',
  safariStep2: 'ជ្រើស While Using the App',
  safariStep3: 'បើក Precise Location',
  safariStep4: 'ត្រឡប់មកទំព័រនេះ ហើយចុចឈ្មោះម្តងទៀត',
  safariTelegramHint: 'បើ Safari នៅតែមិនអនុញ្ញាត អ្នកអាចបើកតំណនេះក្នុង Telegram browser បាន។',
  hideHelp: 'បិទការណែនាំ',
  notAtSchool: 'អ្នកនៅឆ្ងាយពីក្រុមហ៊ុន ឬស្ថាប័ន {{distance}} ម៉ែត្រ។ សូមមកក្រុមហ៊ុន ឬស្ថាប័នដើម្បីចុះវត្តមាន។',
  distance: 'ចម្ងាយ',
  meters: 'ម៉ែត្រ',
  fromSchool: 'ពីក្រុមហ៊ុន ឬស្ថាប័ន'
};

const formatMinutes = (totalMinutes: number): string => {
  if (!totalMinutes) return `0 ${translations.minutes}`;
  if (totalMinutes < 60) return `${totalMinutes} ${translations.minutes}`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} ${translations.hours}`;
  return `${hours} ${translations.hours} ${mins} ${translations.minutes}`;
};

export default function ScanPage() {
  const [step, setStep] = useState<'welcome' | 'scan' | 'employees' | 'success' | 'error'>('welcome');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [debug, setDebug] = useState<string>('');

  // Location states
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [schoolLocation, setSchoolLocation] = useState<{ lat: number, lng: number, radius: number } | null>(null);
  const [showSafariHelp, setShowSafariHelp] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const detectIPhoneSafari = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(ua) &&
      /Safari/i.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Line|Telegram/i.test(ua);
  };

  useEffect(() => {
    loadEmployees();
    loadSchoolLocation();

    // Check if user came directly from scanning a URL-based QR code
    const urlParams = new URLSearchParams(window.location.search);
    const qrParam = urlParams.get('qr');
    if (qrParam === 'SCHOOL_ATTENDANCE' || qrParam?.includes('school-attendance')) {
      setStep('employees');
    }

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const loadSchoolLocation = async () => {
    try {
      const data = await getPublicSchoolSettingsAction();
      const nextSchoolLocation = {
        lat: data.latitude,
        lng: data.longitude,
        radius: data.allowed_radius
      };
      setSchoolLocation(nextSchoolLocation);
      return nextSchoolLocation;
    } catch (err) {
      console.error('Error loading school location:', err);
      return null;
    }
  };

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const data = await getPublicEmployeesAction();
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(translations.checkInFailed);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const getUserLocation = (): Promise<{ lat: number, lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!window.isSecureContext) {
        reject(new Error('Geolocation requires a secure context (HTTPS or localhost)'));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  };

  const verifyLocation = async (): Promise<{ ok: boolean; location?: { lat: number; lng: number }; distance?: number }> => {
    setIsVerifyingLocation(true);
    setLocationVerified(false);
    setLocationError(null);
    setShowSafariHelp(false);

    try {
      const resolvedSchoolLocation = schoolLocation ?? await loadSchoolLocation();
      if (!resolvedSchoolLocation) {
        setLocationError(translations.locationNotReady);
        return { ok: false };
      }

      const location = await getUserLocation();
      setUserLocation(location);

      const dist = calculateDistance(
        location.lat, location.lng,
        resolvedSchoolLocation.lat, resolvedSchoolLocation.lng
      );
      setDistance(dist);

      if (dist <= resolvedSchoolLocation.radius) {
        setLocationVerified(true);
        return { ok: true, location, distance: dist };
      } else {
        const errorMsg = translations.notAtSchool.replace('{{distance}}', dist.toString());
        setLocationError(errorMsg);
        return { ok: false, location, distance: dist };
      }
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(translations.locationDenied);
            setShowSafariHelp(detectIPhoneSafari());
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(translations.locationUnavailable);
            break;
          case error.TIMEOUT:
            setLocationError(translations.locationTimeout);
            break;
          default:
            setLocationError(translations.locationUnavailable);
        }
      } else if (error instanceof Error && error.message.includes('secure context')) {
        setLocationError(translations.locationRequiresHttps);
      } else {
        setLocationError(translations.locationUnavailable);
      }
      return { ok: false };
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraInitialized(false);
  }, []);

  const startCamera = async () => {
    setCameraPermission(null);
    setCameraInitialized(false);
    setError(null);
    setDebug('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraInitialized(true);
          startQRScanning();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraPermission(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(translations.cameraAccessDenied);
        } else if (err.name === 'NotFoundError') {
          setError(translations.noCamera);
        } else {
          setError(translations.cameraAccessDenied);
        }
      }
    }
  };

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) return;

    import('jsqr').then((jsQR) => {
      scanIntervalRef.current = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR.default(imageData.data, canvas.width, canvas.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              handleQRCode(code.data);
            }
          } catch (e) {
            // Ignore
          }
        }
      }, 300);
    }).catch(err => {
      console.error('Failed to load QR scanner:', err);
      setError(translations.checkInFailed);
    });
  };

  const handleQRCode = async (data: string) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopCamera();

    const validQR = data === 'SCHOOL_ATTENDANCE' || 
                    data.includes('school-attendance') || 
                    data.includes('SCHOOL_ATTENDANCE');

    if (validQR) {
      setStep('employees');
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      setError(translations.invalidQR);
      setStep('error');
    }
  };

  const handleEmployeeSelect = async (employee: Employee) => {
    setLoading(true);
    setSelectedEmployee(employee);

    try {
      const verification = await verifyLocation();
      if (!verification.ok || !verification.location) {
        setLoading(false);
        setStep('error');
        return;
      }

      const result = await recordAttendanceAction({
        employee_id: employee.id,
        location: translations.schoolEntrance,
        location_lat: verification.location.lat,
        location_lng: verification.location.lng,
        location_verified: true,
        distance_from_school: verification.distance,
      });

      if (result.alreadyCheckedIn) {
        setStep('success');
        setLoading(false);
        return;
      }

      setStep('success');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (err) {
      console.error('Check-in error:', err);
      setError(translations.checkInFailed);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setStep('scan');
    setError(null);
    startCamera();
  };

  const resetToWelcome = () => {
    stopCamera();
    setStep('welcome');
    setSearchTerm('');
    setSelectedEmployee(null);
    setError(null);
    setCameraPermission(null);
    setCameraInitialized(false);
    setLocationVerified(false);
    setLocationError(null);
    setDistance(null);
  };

  const retryScan = () => {
    setError(null);
    startScanning();
  };

  const requestLocationPermission = async () => {
    await verifyLocation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-relaxed py-3">
            {translations.appTitle}
          </h1>
          <p className="text-gray-600 mt-2">{translations.appSubtitle}</p>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between text-white">
                <span className="font-medium">
                  {step === 'welcome' && `📱 ${translations.ready}`}
                  {step === 'scan' && `📸 ${translations.scanning}`}
                  {step === 'employees' && `👆 ${translations.selectYourName}`}
                  {step === 'success' && `✅ ${translations.checkInComplete}`}
                  {step === 'error' && `❌ ${translations.error}`}
                </span>
                {step === 'scan' && cameraInitialized && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-ping animation-delay-200"></div>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 text-black"
                  >
                    <div className="bg-blue-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-16 h-16 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{translations.welcome}</h2>
                    <p className="text-gray-600 mb-8">{translations.scanInstruction}</p>
                    <button
                      onClick={startScanning}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      {translations.startCamera}
                    </button>
                    {error && (
                      <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-lg flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'scan' && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                      {!cameraInitialized && cameraPermission !== false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-white text-center">
                            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">{translations.initializingCamera}</p>
                          </div>
                        </div>
                      )}

                      {cameraPermission === false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="text-white text-center p-6">
                            <CameraOff className="w-12 h-12 mx-auto mb-3 text-red-400" />
                            <p className="text-sm mb-2">{translations.cameraAccessDenied}</p>
                            <button
                              onClick={retryScan}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                              {translations.tryAgain}
                            </button>
                          </div>
                        </div>
                      )}

                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white rounded-2xl opacity-50"></div>
                      </div>
                      {cameraInitialized && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{translations.pointCamera}</p>
                    <button
                      onClick={resetToWelcome}
                      className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      {translations.cancel}
                    </button>
                  </motion.div>
                )}

                {step === 'employees' && (
                  <motion.div
                    key="employees"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {employeesLoading && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Loader className="h-5 w-5 animate-spin" />
                          <span>កំពុងផ្ទុកបញ្ជីបុគ្គលិក...</span>
                        </div>
                      </div>
                    )}

                    {isVerifyingLocation && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Navigation className="h-5 w-5 animate-pulse" />
                          <span>{translations.verifyingLocation}</span>
                        </div>
                      </div>
                    )}

                    {locationVerified && distance && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between text-green-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <span>{translations.locationVerified}</span>
                          </div>
                          <span className="text-sm">
                            {distance} {translations.meters} {translations.fromSchool}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-green-700">{translations.locationReadyToCheckIn}</p>
                      </div>
                    )}

                    {locationError && (
                      <div className="mb-4 p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                          <span>{locationError}</span>
                        </div>
                      </div>
                    )}

                    {showSafariHelp && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold">{translations.safariHelpTitle}</p>
                            <p className="mt-1 text-sm">{translations.safariHelpBody}</p>
                            <div className="mt-3 space-y-1 text-sm">
                              <p>1. {translations.safariStep1}</p>
                              <p>2. {translations.safariStep2}</p>
                              <p>3. {translations.safariStep3}</p>
                              <p>4. {translations.safariStep4}</p>
                            </div>
                            <p className="mt-3 text-sm">{translations.safariTelegramHint}</p>
                            <button
                              type="button"
                              onClick={() => setShowSafariHelp(false)}
                              className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
                            >
                              {translations.hideHelp}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!locationVerified && (
                      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-blue-900">{translations.locationPermissionHelp}</p>
                          </div>
                          <button
                            type="button"
                            onClick={requestLocationPermission}
                            disabled={isVerifyingLocation || !schoolLocation}
                            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {isVerifyingLocation ? translations.verifyingLocation : translations.allowLocation}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900" />
                      <input
                        type="text"
                        placeholder={translations.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                        autoFocus
                        disabled={employeesLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                      <p>{filteredEmployees.length} {translations.employeesFound}</p>
                      <button onClick={resetToWelcome} className="text-blue-600">← {translations.back}</button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                      {employeesLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          កំពុងផ្ទុកបុគ្គលិក...
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {translations.noEmployeesFound} "{searchTerm}"
                        </div>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <motion.button
                            key={employee.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleEmployeeSelect(employee)}
                            disabled={loading || !schoolLocation}
                            className="w-full text-left p-4 border-2 rounded-xl transition-all flex items-center space-x-3"
                          >
                            <span className="text-3xl">{employee.emoji || '👩‍🏫'}</span>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{employee.full_name}</div>
                              <div className="text-sm text-gray-500">{employee.department}</div>
                              <div className="text-xs text-gray-400 mt-1">{employee.employee_id}</div>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 'success' && selectedEmployee && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="bg-green-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-green-600 mb-2">{translations.welcome_back}</h2>
                    <div className="text-5xl mb-2">{selectedEmployee.emoji}</div>
                    <p className="text-2xl font-semibold mb-1 text-black">{selectedEmployee.full_name}</p>
                    <p className="text-gray-500 mb-4">{selectedEmployee.department}</p>
                    <div className="bg-blue-50 rounded-xl p-4 mt-4">
                      <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{new Date().toLocaleTimeString('km-KH')}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-blue-600">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{translations.schoolEntrance}</span>
                      </div>
                    </div>
                    <button
                      onClick={resetToWelcome}
                      className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      {translations.checkInAnother}
                    </button>
                  </motion.div>
                )}

                {step === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="bg-red-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                      <XCircle className="w-16 h-16 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">{translations.checkInFailed}</h2>
                    <p className="text-gray-600 mb-6">{locationError || error || translations.checkInFailed}</p>
                    <div className="flex space-x-3">
                      <button onClick={retryScan} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold">{translations.tryAgain}</button>
                      <button onClick={resetToWelcome} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">{translations.cancel}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t text-center text-sm text-gray-500">
              {step === 'welcome' && '📍 QR តែមួយ • បុគ្គលិកទាំងអស់ • GPS ផ្ទៀងផ្ទាត់'}
              {step === 'scan' && `🎯 ${translations.centerQR}`}
              {step === 'employees' && `👥 ${translations.selectYourName}`}
              {step === 'success' && `✨ ${translations.haveNiceDay}`}
            </div>
          </motion.div>
          
          {step === 'welcome' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-white rounded-xl p-4 shadow"
            >
              <h3 className="font-semibold mb-3 flex items-center text-black">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                {translations.todayCheckins}
              </h3>
              <div className="text-center text-gray-400 text-sm py-4">
                រង់ចាំបុគ្គលិកចុះវត្តមាន...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
