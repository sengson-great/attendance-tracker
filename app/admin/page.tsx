'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { addEmployeeAction, deleteEmployeeAction, updateSchoolSettingsAction, fetchAdminDataAction } from '../actions';
import {
    Users, UserCheck, UserX, Clock, Calendar,
    Download, Plus, Search, Printer, Trash2,
    AlertTriangle, Timer, Coffee, Settings,
    Send, MessageSquare, Bell, MapPin, LogOut
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Khmer translations
const translations = {
    // Page title
    adminTitle: 'អ្នកគ្រប់គ្រងវត្តមានក្រុមហ៊ុន ឬស្ថាប័ន',

    // Stats cards
    totalEmployees: 'បុគ្គលិកសរុប',
    present: 'វត្តមាន',
    onTime: 'ទាន់ពេល',
    late: 'យឺត',
    veryLate: 'យឺតខ្លាំង',
    absent: 'អវត្តមាន',

    // Buttons
    telegram: 'តេឡេក្រាម',
    sendSummary: 'ផ្ញើរបាយការណ៍',
    settings: 'ការកំណត់',
    lateSettings: 'កំណត់ការយឺត',
    printQR: 'បោះពុម្ព QR',
    exportExcel: 'ទាញយក Excel',
    addEmployee: 'បន្ថែមបុគ្គលិក',

    // Status indicators
    sending: 'កំពុងផ្ញើ...',
    sent: 'ផ្ញើរួច! ✅',
    error: 'កំហុស ❌',
    telegramActive: 'តេឡេក្រាមសកម្ម',

    // Late summary
    employeesLateToday: 'បុគ្គលិកយឺតថ្ងៃនេះ',
    averageLate: 'មធ្យមយឺត',
    minutes: 'នាទី',
    hours: 'ម៉ោង',

    // Date selector
    selectDate: 'ជ្រើសរើសកាលបរិច្ឆេទ',

    // Attendance table
    attendanceFor: 'វត្តមានសម្រាប់',
    noCheckIns: 'មិនទាន់មានការចុះវត្តមានសម្រាប់ថ្ងៃនេះទេ',
    scanMessage: 'បុគ្គលិកមិនទាន់បានស្កេន QR នៅឡើយទេ',

    // Table headers
    employee: 'បុគ្គលិក',
    employeeId: 'លេខសម្គាល់',
    checkInTime: 'ម៉ោងចុះវត្តមាន',
    status: 'ស្ថានភាព',
    lateMinutes: 'នាទីយឺត',
    location: 'ទីតាំង',

    // Status labels
    onTimeLabel: 'ទាន់ពេល',
    lateLabel: 'យឺត',
    veryLateLabel: 'យឺតខ្លាំង',
    unknown: 'មិនស្គាល់',

    // Location status
    verified: 'បានផ្ទៀងផ្ទាត់',
    notVerified: 'មិនបានផ្ទៀងផ្ទាត់',
    meters: 'ម',

    // Employee management
    manageEmployees: 'គ្រប់គ្រងបុគ្គលិក',
    searchEmployees: 'ស្វែងរកបុគ្គលិក...',
    noEmployeesFound: 'រកមិនឃើញបុគ្គលិកទេ',
    telegramConnected: 'តេឡេក្រាម ✓',
    minLate: 'នាទីយឺត',
    onTimeSmall: 'ទាន់ពេល',
    connectTelegram: 'ភ្ជាប់តេឡេក្រាម',
    deleteEmployee: 'លុបបុគ្គលិក',

    // Add employee modal
    addNewEmployee: 'បន្ថែមបុគ្គលិកថ្មី',
    employeeIdLabel: 'លេខសម្គាល់បុគ្គលិក',
    employeeIdPlaceholder: 'TCH001 (ទុកចោលបាន ប្រព័ន្ធនឹងបង្កើតឱ្យ)',
    fullNameLabel: 'ឈ្មោះពេញ',
    fullNamePlaceholder: 'ឧ. សុខ ចាន់ណា',
    departmentLabel: 'ដេប៉ាតឺម៉ង់',
    departmentPlaceholder: 'ឧ. គណិតវិទ្យា',
    emojiLabel: 'សញ្ញាអារម្មណ៍',
    femaleEmployee: '👩‍🏫 បុគ្គលិកស្រី',
    maleEmployee: '👨‍🏫 បុគ្គលិកប្រុស',
    addButton: 'បន្ថែមបុគ្គលិក',
    cancelButton: 'បោះបង់',

    // Late settings modal
    lateSettingsTitle: 'កំណត់ការយឺត',
    schoolStartTime: 'ម៉ោងចាប់ផ្តើមក្រុមហ៊ុន ឬស្ថាប័ន',
    gracePeriod: 'រយៈពេលអនុគ្រោះ (នាទី)',
    graceHelp: 'នាទីបន្ទាប់ពីម៉ោងចាប់ផ្តើម រាប់ថា "ទាន់ពេល"',
    currentRules: 'ច្បាប់បច្ចុប្បន្ន:',
    onTimeRule: 'ទាន់ពេល: មុនម៉ោង',
    lateRule: 'យឺត:',
    veryLateRule: 'យឺតខ្លាំង: ៣១+ នាទីបន្ទាប់ពីចាប់ផ្តើម',
    minGrace: 'នាទីអនុគ្រោះ',
    afterStart: 'នាទីបន្ទាប់ពីចាប់ផ្តើម',
    saveSettings: 'រក្សាទុកការកំណត់',

    // Telegram settings modal
    telegramSettings: 'ការកំណត់តេឡេក្រាម',
    enableTelegram: 'បើកប្រើតេឡេក្រាម',
    botToken: 'Bot Token',
    botTokenPlaceholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
    botTokenHelp: 'ទទួលបានពី @BotFather លើតេឡេក្រាម',
    chatId: 'Chat ID',
    chatIdPlaceholder: '-1234567890',
    chatIdHelp: 'ID របស់ Chat (អាចជាលេខអវិជ្ជមានសម្រាប់ក្រុម)',
    notifyWhen: 'ជូនដំណឹងនៅពេល:',
    notifyOnTime: 'វត្តមានទាន់ពេល',
    notifyLate: 'វត្តមានយឺត',
    notifyVeryLate: 'វត្តមានយឺតខ្លាំង',
    testConnection: 'សាកល្បងការតភ្ជាប់',

    // Telegram link modal
    connectTelegramTitle: 'ភ្ជាប់តេឡេក្រាម',
    shareLink: 'ចែករំលែកតំណភ្ជាប់នេះទៅកាន់បុគ្គលិកដើម្បីភ្ជាប់តេឡេក្រាម:',
    copyLink: 'ចម្លងតំណ',
    close: 'បិទ',

    // Required field
    required: '*',

    // Messages
    fillRequiredFields: 'សូមបំពេញព័ត៌មានដែលត្រូវការ',
    addSuccess: 'បានបន្ថែមបុគ្គលិកដោយជោគជ័យ',
    addError: 'មានបញ្ហាក្នុងការបន្ថែមបុគ្គលិក',
    deleteConfirm: 'តើអ្នកប្រាកដថាចង់លុបបុគ្គលិកនេះទេ?',
    deleteSuccess: 'បានលុបបុគ្គលិកដោយជោគជ័យ',
    deleteError: 'មានបញ្ហាក្នុងការលុបបុគ្គលិក',
    copySuccess: 'បានចម្លងតំណភ្ជាប់ទៅកាន់ចង្កោម!',
    telegramNotConfigured: 'សូមកំណត់រចនាសម្ព័ន្ធតេឡេក្រាមជាមុន',
    summarySent: 'បានផ្ញើរបាយការណ៍ប្រចាំថ្ងៃទៅកាន់តេឡេក្រាម!',
    summaryFailed: 'បរាជ័យក្នុងការផ្ញើរបាយការណ៍',
    testSent: 'សារសាកល្បងបានផ្ញើទៅកាន់តេឡេក្រាម! សូមពិនិត្យមើល chat របស់អ្នក។',
    testFailed: 'បរាជ័យក្នុងការផ្ញើសារសាកល្បង',
    qrError: 'មានបញ្ហាក្នុងការបង្កើត QR',
    popupBlocked: 'សូមអនុញ្ញាតិឱ្យបើក pop-up',
    exportError: 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យ',
};

// Types
interface Employee {
    id: string;
    full_name: string;
    employee_id: string;
    department: string;
    emoji: string;
    telegram_chat_id?: string;
}

interface Attendance {
    location_verified: any;
    distance_from_school: any;
    id: string;
    employee_name: string;
    employee_id: string;
    check_in: string;
    date: string;
    status: 'on-time' | 'late' | 'very-late';
    late_minutes?: number;
    late_category?: 'minor' | 'moderate' | 'severe';
}

interface Stats {
    total: number;
    present: number;
    absent: number;
    late: number;
    veryLate: number;
    onTime: number;
}

interface TelegramConfig {
    enabled: boolean;
    chatId: string;
    notifyOnTime: boolean;
    notifyLate: boolean;
    notifyVeryLate: boolean;
    notifyAbsent: boolean;
}

// Late configuration
const LATE_CONFIG = {
    schoolStartHour: 7,
    schoolStartMinute: 0,
    gracePeriod: 5,
    categories: {
        'on-time': { max: 5, color: 'green', label: 'ទាន់ពេល', icon: '✅' },
        'late': { min: 6, max: 30, color: 'yellow', label: 'យឺត', icon: '⚠️' },
        'very-late': { min: 31, max: 999, color: 'red', label: 'យឺតខ្លាំង', icon: '🔴' }
    }
};

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Color type for stat cards
type ColorType = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'teal';

// Color mapping
const colorClasses: Record<ColorType, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600'
};

const formatMinutes = (totalMinutes: number): string => {
    if (!totalMinutes) return `0 ${translations.minutes}`;
    if (totalMinutes < 60) return `${totalMinutes} ${translations.minutes}`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) return `${hours} ${translations.hours}`;
    return `${hours} ${translations.hours} ${mins} ${translations.minutes}`;
};

const toKhmerNum = (num: number | string) => {
    const khmerNums = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toString().split('').map(n => khmerNums[parseInt(n)] || n).join('');
};

const formatKhmerDateLong = (dateString: string | Date) => {
    const days = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

    const d = new Date(dateString);
    const dayName = days[d.getDay()];
    const date = toKhmerNum(d.getDate());
    const month = months[d.getMonth()];
    const year = toKhmerNum(d.getFullYear());

    return `ថ្ងៃ${dayName} ទី${date} ខែ${month} ឆ្នាំ${year}`;
};

export default function AdminPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        veryLate: 0,
        onTime: 0
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showLateConfig, setShowLateConfig] = useState(false);
    const [showTelegramConfig, setShowTelegramConfig] = useState(false);
    const [showTelegramLink, setShowTelegramLink] = useState(false);
    const [selectedEmployeeForTelegram, setSelectedEmployeeForTelegram] = useState<Employee | null>(null);

    const [newEmployee, setNewEmployee] = useState({
        employee_id: '',
        full_name: '',
        department: '',
        emoji: '👩‍🏫'
    });

    const [lateConfig, setLateConfig] = useState({
        schoolStartHour: 7,
        schoolStartMinute: 0,
        gracePeriod: 5
    });
    const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
        enabled: true,
        chatId: '',
        notifyOnTime: false,
        notifyLate: true,
        notifyVeryLate: true,
        notifyAbsent: true
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(false);
    const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    // Removed duplicate loadSettings effect

    useEffect(() => {
        loadData();

        // Set up real-time subscription for new attendance records
        const subscription = supabase
            .channel('attendance-changes')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'attendance'
                },
                async (payload: any) => {
                    console.log('New attendance record detected:', payload);
                    // Reload data to update stats
                    await loadData();
                    // Send Telegram notification for the new check-in
                    await sendTelegramNotification(payload.new);
                }
            )
            .subscribe((status: any) => {
                console.log('Subscription status:', status);
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [selectedDate, telegramConfig]);

    // Calculate late status based on check-in time
    const calculateLateStatus = (checkInTime: string, config: any): { status: 'on-time' | 'late' | 'very-late', minutes: number } => {
        const checkIn = new Date(checkInTime);
        const startTime = new Date(checkIn);
        startTime.setHours(config.schoolStartHour, config.schoolStartMinute, 0);

        const diffMinutes = Math.floor((checkIn.getTime() - startTime.getTime()) / (1000 * 60));

        if (diffMinutes <= config.gracePeriod) {
            return { status: 'on-time', minutes: 0 };
        } else if (diffMinutes <= 30) {
            return { status: 'late', minutes: diffMinutes };
        } else {
            return { status: 'very-late', minutes: diffMinutes };
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminDataAction(selectedDate);

            const employeesData = data.employees;
            const attendanceData = data.attendance;

            if (data.settings) {
                setLateConfig({
                    schoolStartHour: data.settings.school_start_hour,
                    schoolStartMinute: data.settings.school_start_minute,
                    gracePeriod: data.settings.grace_period
                });
            }

            setEmployees(employeesData || []);

            // Process attendance with late status
            const processedAttendance = (attendanceData || []).map(record => {
                const config = data.settings ? {
                    schoolStartHour: data.settings.school_start_hour,
                    schoolStartMinute: data.settings.school_start_minute,
                    gracePeriod: data.settings.grace_period
                } : lateConfig;
                const { status, minutes } = calculateLateStatus(record.check_in, config);
                return {
                    ...record,
                    status,
                    late_minutes: minutes
                };
            });

            setAttendance(processedAttendance);

            // Calculate detailed stats
            const present = processedAttendance.length;
            const onTime = processedAttendance.filter(a => a.status === 'on-time').length;
            const late = processedAttendance.filter(a => a.status === 'late').length;
            const veryLate = processedAttendance.filter(a => a.status === 'very-late').length;

            // Calculate average late minutes (only for late arrivals)
            const lateMinutes = processedAttendance
                .filter(a => a.late_minutes && a.late_minutes > 0)
                .map(a => a.late_minutes || 0);

            setStats({
                total: employeesData?.length || 0,
                present,
                absent: (employeesData?.length || 0) - present,
                late,
                veryLate,
                onTime,
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendTelegramNotification = async (attendanceRecord: any) => {
        setTelegramStatus('sending');

        try {
            const response = await fetch('/api/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'checkin',
                    employeeName: attendanceRecord.employee_name,
                    employeeId: attendanceRecord.employee_id,
                    checkInTime: attendanceRecord.check_in,
                    status: attendanceRecord.status,
                    lateMinutes: attendanceRecord.late_minutes,
                    distance: attendanceRecord.distance_from_school
                })
            });

            const data = await response.json();
            console.log('Telegram response:', data);

            if (response.ok) {
                setTelegramStatus('sent');
                setTimeout(() => setTelegramStatus('idle'), 3000);
                console.log('Telegram notification sent successfully');
            } else {
                setTelegramStatus('error');
                console.error('Telegram error:', data.error);
            }
        } catch (error) {
            console.error('Telegram fetch error:', error);
            setTelegramStatus('error');
        }
    };

    const sendDailySummary = async () => {
        setTelegramStatus('sending');

        const attendanceList = attendance.map(a => {
            const time = new Date(a.check_in).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' });
            const icon = a.status === 'on-time' ? '✅' : a.status === 'late' ? '⚠️' : '🔴';
            return `${icon} ${a.employee_name} - ${time}${a.late_minutes ? ` (${formatMinutes(a.late_minutes)})` : ''}`;
        }).join('\n');

        const message = `
*📊 របាយការណ៍វត្តមានប្រចាំថ្ងៃ*
📅 *កាលបរិច្ឆេទ:* ${formatKhmerDateLong(selectedDate)}

✅ *ទាន់ពេល:* ${stats.onTime}
⚠️ *យឺត:* ${stats.late}
🔴 *យឺតខ្លាំង:* ${stats.veryLate}
👥 *វត្តមាន:* ${stats.present}/${stats.total}
❌ *អវត្តមាន:* ${stats.absent}

*ព័ត៌មានលម្អិត:*
${attendanceList || 'មិនទាន់មានការចុះវត្តមាននៅឡើយទេ'}
    `;

        try {
            const response = await fetch('/api/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message.trim()
                })
            });

            if (response.ok) {
                setTelegramStatus('sent');
                setTimeout(() => setTelegramStatus('idle'), 3000);
                alert(translations.summarySent);
            } else {
                setTelegramStatus('error');
                alert(translations.summaryFailed);
            }
        } catch (error) {
            console.error('Telegram error:', error);
            setTelegramStatus('error');
            alert(translations.summaryFailed);
        }
    };

    const testTelegramConnection = async () => {
        setTelegramStatus('sending');

        try {
            const response = await fetch('/api/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'test'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setTelegramStatus('sent');
                setTimeout(() => setTelegramStatus('idle'), 3000);
                alert(translations.testSent);
            } else {
                setTelegramStatus('error');
                alert(`${translations.testFailed}: ${data.error || translations.unknown}`);
            }
        } catch (error) {
            console.error('Telegram error:', error);
            setTelegramStatus('error');
            alert(translations.testFailed);
        }
    };

    const generateTelegramLink = (employee: Employee) => {
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourBot';
        const link = `https://t.me/${botUsername}?start=${employee.id}`;

        navigator.clipboard.writeText(link);
        alert(translations.copySuccess);
        setShowTelegramLink(false);
    };

    const addEmployee = async () => {
        if (!newEmployee.full_name) {
            alert(translations.fillRequiredFields);
            return;
        }

        try {
            await addEmployeeAction({
                employee_id: newEmployee.employee_id || `TCH${Math.floor(100 + Math.random() * 900)}`,
                full_name: newEmployee.full_name,
                department: newEmployee.department || 'មិនមានកំណត់',
                emoji: newEmployee.emoji,
                active: true
            });

            setShowAddForm(false);
            setNewEmployee({
                employee_id: '',
                full_name: '',
                department: '',
                emoji: '👩‍🏫'
            });
            loadData();
            alert(translations.addSuccess);
        } catch (error) {
            alert(translations.addError);
        }
    };

    const deleteEmployee = async (id: string) => {
        if (confirm(translations.deleteConfirm)) {
            try {
                await deleteEmployeeAction(id);
                loadData();
                alert(translations.deleteSuccess);
            } catch (error) {
                alert(translations.deleteError);
            }
        }
    };

    const printSchoolQR = () => {
        // Automatically grab the Vercel URL you are currently on!
        const qrData = `${window.location.origin}/scan?qr=SCHOOL_ATTENDANCE`;

        import('qrcode').then((QRCode) => {
            QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#4F46E5',
                    light: '#FFFFFF'
                }
            }, (err, url) => {
                if (err) {
                    alert(translations.qrError);
                    return;
                }

                const win = window.open('', '_blank');
                if (!win) {
                    alert(translations.popupBlocked);
                    return;
                }

                win.document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>School Attendance QR Code</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  body { 
                    text-align: center; 
                    padding: 20px; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f0f9ff;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px 20px;
                    border-radius: 30px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  }
                  h1 { 
                    color: #4F46E5; 
                    font-size: 32px;
                    margin-bottom: 10px;
                  }
                  h2 { 
                    color: #1f2937; 
                    font-size: 24px;
                    margin-bottom: 20px;
                    font-weight: normal;
                  }
                  .qr-code {
                    background: white;
                    padding: 20px;
                    border-radius: 20px;
                    border: 4px solid #4F46E5;
                    margin: 30px 0;
                    display: inline-block;
                  }
                  .qr-code img {
                    width: 250px;
                    height: 250px;
                    display: block;
                  }
                  .instructions {
                    text-align: left;
                    background: #f3f4f6;
                    padding: 25px;
                    border-radius: 15px;
                    margin: 30px 0;
                  }
                  .instructions h3 {
                    color: #4F46E5;
                    margin-bottom: 15px;
                    font-size: 20px;
                  }
                  .instructions ol {
                    margin-left: 20px;
                    line-height: 2;
                    color: #4b5563;
                  }
                  .instructions li {
                    margin-bottom: 10px;
                  }
                  .button {
                    background: #4F46E5;
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 18px;
                    font-weight: 600;
                    border-radius: 50px;
                    cursor: pointer;
                    margin: 20px 0;
                    transition: transform 0.2s;
                  }
                  .button:hover {
                    transform: scale(1.05);
                  }
                  .footer {
                    color: #9ca3af;
                    font-size: 14px;
                    margin-top: 30px;
                  }
                  @media print {
                    .button { display: none; }
                    body { background: white; padding: 0; }
                    .container { box-shadow: none; padding: 20px; }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>🏫 ចុះវត្តមានក្រុមហ៊ុន ឬស្ថាប័ន</h1>
                  <h2>QR មួយសម្រាប់បុគ្គលិកទាំងអស់</h2>
                  
                  <div class="qr-code">
                    <img src="${url}" alt="School QR Code" />
                  </div>
                  
                  <div style="font-size: 28px; font-weight: bold; color: #4F46E5; margin: 20px 0;">
                    ស្កេនដើម្បីចុះវត្តមាន
                  </div>
                  
                  <div class="instructions">
                    <h3>📋 របៀបប្រើប្រាស់:</h3>
                    <ol>
                      <li>ដាក់ QR code នេះនៅច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន</li>
                      <li>បុគ្គលិកស្កេនជាមួយកាមេរ៉ាទូរស័ព្ទ</li>
                      <li>ជ្រើសរើសឈ្មោះរបស់ពួកគេពីបញ្ជី</li>
                      <li>ចុះវត្តមានរួចរាល់! ✅</li>
                    </ol>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                      ក្រុមហ៊ុន ឬស្ថាប័នចាប់ផ្តើមនៅម៉ោង ${lateConfig.schoolStartHour}:${lateConfig.schoolStartMinute.toString().padStart(2, '0')} ព្រឹក
                    </p>
                  </div>
                  
                  <button class="button" onclick="window.print()">
                    🖨️ បោះពុម្ព QR
                  </button>
                  
                  <div class="footer">
                    QR តែមួយ • បុគ្គលិកទាំងអស់ • ចុះវត្តមានភ្លាមៗ
                  </div>
                </div>
                <script>
                  // Auto-print dialog
                  window.onload = function() {
                    setTimeout(() => {
                      if (confirm('បោះពុម្ព QR ឥឡូវនេះទេ?')) {
                        window.print();
                      }
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `;
                win.document.close();
            });
        }).catch(err => {
            console.error('QR Generator failed to load:', err);
            alert(translations.qrError);
        });
    };

    const exportToExcel = () => {
        try {
            const headers = ['កាលបរិច្ឆេទ', 'បុគ្គលិក', 'លេខសម្គាល់', 'ម៉ោងចុះវត្តមាន', 'ស្ថានភាព', 'រយៈពេលយឺត'];
            const rows = attendance.map(a => [
                a.date,
                a.employee_name,
                a.employee_id,
                new Date(a.check_in).toLocaleTimeString('km-KH'),
                a.status === 'on-time' ? 'ទាន់ពេល' : a.status === 'late' ? 'យឺត' : 'យឺតខ្លាំង',
                a.late_minutes ? (a.late_minutes > 60 ? Math.floor(a.late_minutes / 60) + 'ម៉ោង' + (a.late_minutes % 60) + 'នាទី' : a.late_minutes + 'នាទី') : '-'
            ]);

            const data = [headers, ...rows];
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

            // Generate buffer and save
            XLSX.writeFile(workbook, `attendance-${selectedDate}.xlsx`);
        } catch (error) {
            alert(translations.exportError);
        }
    };

    const filteredEmployees = employees.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get status color and icon
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'on-time':
                return { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: translations.onTimeLabel };
            case 'late':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠️', label: translations.lateLabel };
            case 'very-late':
                return { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴', label: translations.veryLateLabel };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓', label: translations.unknown };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Users className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-gray-800">{translations.adminTitle}</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Telegram Status Indicator */}
                            {telegramConfig.enabled && (
                                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-600">
                                        {telegramStatus === 'sending' && translations.sending}
                                        {telegramStatus === 'sent' && translations.sent}
                                        {telegramStatus === 'error' && translations.error}
                                        {telegramStatus === 'idle' && translations.telegramActive}
                                    </span>
                                </div>
                            )}

                            {/* <button
                                onClick={() => setShowTelegramConfig(true)}
                                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                title={translations.telegram}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {translations.telegram}
                            </button> */}

                            <button
                                onClick={sendDailySummary}
                                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                title={translations.sendSummary}
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                {translations.sendSummary}
                            </button>

                            <Link
                                href="/admin/settings"
                                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                title={translations.settings}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                {translations.settings}
                            </Link>

                            <button
                                onClick={printSchoolQR}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {translations.printQR}
                            </button>

                            <button
                                onClick={exportToExcel}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {translations.exportExcel}
                            </button>

                            <button
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {translations.addEmployee}
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await fetch('/api/auth', { method: 'DELETE' });
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        window.location.href = '/';
                                    }
                                }}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                title="ចាកចេញ"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                ចាកចេញ
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
                    <StatCard
                        title={translations.totalEmployees}
                        value={stats.total}
                        icon={<Users className="h-5 w-5" />}
                        color="blue"
                    />
                    <StatCard
                        title={translations.present}
                        value={stats.present}
                        icon={<UserCheck className="h-5 w-5" />}
                        color="green"
                    />
                    <StatCard
                        title={translations.onTime}
                        value={stats.onTime}
                        icon={<Coffee className="h-5 w-5" />}
                        color="teal"
                    />
                    <StatCard
                        title={translations.late}
                        value={stats.late}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        color="yellow"
                    />
                    <StatCard
                        title={translations.veryLate}
                        value={stats.veryLate}
                        icon={<Timer className="h-5 w-5" />}
                        color="red"
                    />
                    <StatCard
                        title={translations.absent}
                        value={stats.absent}
                        icon={<UserX className="h-5 w-5" />}
                        color="purple"
                    />
                </div>

                {/* Late Summary Card */}
                {(stats.late + stats.veryLate > 0) && (
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <span className="font-medium text-gray-700">
                                    ⚠️ {stats.late + stats.veryLate} {translations.employeesLateToday}
                                </span>
                            </div>
                            <button
                                onClick={sendDailySummary}
                                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                            >
                                {translations.sendSummary}
                            </button>
                        </div>
                    </div>
                )}

                {/* Date Selector */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 font-medium">{translations.selectDate}:</span>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="flex items-center space-x-4 ml-auto">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">{translations.onTime}: {stats.onTime}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">{translations.late}: {stats.late}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">{translations.veryLate}: {stats.veryLate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Attendance */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-black">
                        {translations.attendanceFor} {formatKhmerDateLong(selectedDate)}
                    </h2>

                    {attendance.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-500 text-lg">{translations.noCheckIns}</p>
                            <p className="text-gray-400 text-sm mt-2">{translations.scanMessage}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{translations.employee}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{translations.employeeId}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{translations.checkInTime}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{translations.status}</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{translations.lateMinutes}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((a, i) => {
                                        const statusInfo = getStatusInfo(a.status);
                                        const employee = employees.find(t => t.id === a.employee_id);
                                        return (
                                            <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-black">{a.employee_name}</td>
                                                <td className="py-3 px-4 text-gray-600">{a.employee_id}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {new Date(a.check_in).toLocaleTimeString('km-KH', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text} flex items-center w-fit`}>
                                                        <span className="mr-1">{statusInfo.icon}</span>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {a.late_minutes ? (
                                                        <span className="font-medium text-gray-700">
                                                            {formatMinutes(a.late_minutes)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                {/* <td className="py-3 px-4">
                                                    {a.location_verified ? (
                                                        <div className="flex items-center space-x-1">
                                                            <MapPin className="h-4 w-4 text-green-500" />
                                                            <span className="text-xs text-green-600">
                                                                {a.distance_from_school}{translations.meters}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-500">{translations.notVerified}</span>
                                                    )}
                                                </td> */}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Employees Management */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-semibold text-black">{translations.manageEmployees}</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={translations.searchEmployees}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 text-gray-800 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                            />
                        </div>
                    </div>

                    {filteredEmployees.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">{translations.noEmployeesFound}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEmployees.map((employee) => {
                                const today = attendance.find(a => a.employee_id === employee.id);

                                return (
                                    <motion.div
                                        key={employee.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-indigo-300"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-lg text-black">{employee.full_name}</h3>
                                                    {employee.telegram_chat_id && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                            {translations.telegramConnected}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{employee.employee_id}</p>
                                                <p className="text-xs text-gray-400 mt-1">{employee.department}</p>
                                                {today && (
                                                    <div className="mt-2">
                                                        {today.late_minutes ? (
                                                            <p className={`text-xs flex items-center ${today.status === 'very-late' ? 'text-red-600' : 'text-yellow-600'
                                                                }`}>
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatMinutes(today.late_minutes)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-green-600 flex items-center">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                                {translations.onTimeSmall}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => deleteEmployee(employee.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                                    title={translations.deleteEmployee}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Employee Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-black">{translations.addNewEmployee}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.employeeIdLabel}
                                </label>
                                <input
                                    type="text"
                                    value={newEmployee.employee_id}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500"
                                    placeholder={translations.employeeIdPlaceholder}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.fullNameLabel} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEmployee.full_name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500"
                                    placeholder={translations.fullNamePlaceholder}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.departmentLabel}
                                </label>
                                <input
                                    type="text"
                                    value={newEmployee.department}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500"
                                    placeholder={translations.departmentPlaceholder}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.emojiLabel}
                                </label>
                                <select
                                    value={newEmployee.emoji}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, emoji: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="👩‍🏫">{translations.femaleEmployee}</option>
                                    <option value="👨‍🏫">{translations.maleEmployee}</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-6">
                                <button
                                    onClick={addEmployee}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    {translations.addButton}
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    {translations.cancelButton}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Late Settings Modal */}
            {showLateConfig && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6">{translations.lateSettingsTitle}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.schoolStartTime}
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={lateConfig.schoolStartHour}
                                        onChange={(e) => setLateConfig({
                                            ...lateConfig,
                                            schoolStartHour: parseInt(e.target.value) || 7
                                        })}
                                        className="w-20 border rounded-lg px-3 py-2 text-gray-800"
                                    />
                                    <span className="text-gray-500 self-center">:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={lateConfig.schoolStartMinute}
                                        onChange={(e) => setLateConfig({
                                            ...lateConfig,
                                            schoolStartMinute: parseInt(e.target.value) || 0
                                        })}
                                        className="w-20 border rounded-lg px-3 py-2 text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.gracePeriod}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={lateConfig.gracePeriod}
                                    onChange={(e) => setLateConfig({
                                        ...lateConfig,
                                        gracePeriod: parseInt(e.target.value) || 5
                                    })}
                                    className="w-full border rounded-lg px-4 py-2 text-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {translations.graceHelp}
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-medium text-blue-800 mb-2">{translations.currentRules}</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• {translations.onTimeRule} {lateConfig.schoolStartHour}:{lateConfig.schoolStartMinute.toString().padStart(2, '0')} + {lateConfig.gracePeriod}{translations.minGrace}</li>
                                    <li>• {translations.lateRule} {lateConfig.gracePeriod + 1} - 30 {translations.afterStart}</li>
                                    <li>• {translations.veryLateRule}</li>
                                </ul>
                            </div>

                            <div className="flex space-x-3 pt-6">
                                <button
                                    onClick={async () => {
                                        try {
                                            // Actively update to database so next time we refresh or scan, it's correct instantly
                                            await updateSchoolSettingsAction({
                                                school_start_hour: lateConfig.schoolStartHour,
                                                school_start_minute: lateConfig.schoolStartMinute,
                                                grace_period: lateConfig.gracePeriod
                                            });
                                            setShowLateConfig(false);
                                            loadData();
                                        } catch (error) {
                                            console.error("Failed to save late config", error);
                                        }
                                    }}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    {translations.saveSettings}
                                </button>
                                <button
                                    onClick={() => setShowLateConfig(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    {translations.cancelButton}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Telegram Settings Modal */}
            {showTelegramConfig && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6">{translations.telegramSettings}</h2>

                        <div className="space-y-4">
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                Telegram settings are now managed from `.env` on the server.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.botToken}
                                </label>
                                <div className="w-full border rounded-lg px-4 py-2 text-gray-500 bg-gray-50">
                                    Server-managed in `TELEGRAM_BOT_TOKEN`
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {translations.botTokenHelp}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {translations.chatId}
                                </label>
                                <div className="w-full border rounded-lg px-4 py-2 text-gray-500 bg-gray-50">
                                    Server-managed in `TELEGRAM_CHAT_ID`
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {translations.chatIdHelp}
                                </p>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-medium mb-3">{translations.notifyWhen}</h3>
                                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                    Use `TELEGRAM_ENABLED`, `TELEGRAM_NOTIFY_ON_TIME`, `TELEGRAM_NOTIFY_LATE`, and `TELEGRAM_NOTIFY_VERY_LATE` in `.env`.
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={testTelegramConnection}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {translations.testConnection}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTelegramConfig(false);
                                    }}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    {translations.close}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Telegram Link Modal */}
            {showTelegramLink && selectedEmployeeForTelegram && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6">{translations.connectTelegramTitle}</h2>

                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">{selectedEmployeeForTelegram.emoji}</div>
                            <h3 className="text-xl font-semibold">{selectedEmployeeForTelegram.full_name}</h3>
                            <p className="text-gray-500">{selectedEmployeeForTelegram.employee_id}</p>
                        </div>

                        <p className="text-gray-600 mb-4">
                            {translations.shareLink}
                        </p>

                        <div className="bg-gray-100 p-3 rounded-lg mb-4">
                            <code className="text-sm break-all">
                                https://t.me/{process.env.TELEGRAM_BOT_USERNAME || 'YourBot'}?start={selectedEmployeeForTelegram.id}
                            </code>
                        </div>

                        <button
                            onClick={() => generateTelegramLink(selectedEmployeeForTelegram)}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mb-3"
                        >
                            {translations.copyLink}
                        </button>

                        <button
                            onClick={() => setShowTelegramLink(false)}
                            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                        >
                            {translations.close}
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: ColorType;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-medium">{title}</p>
                    <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
