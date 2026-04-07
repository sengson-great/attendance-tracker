import { NextResponse } from "next/server";

export const TELEGRAM_CONFIG = {
  enabled: process.env.TELEGRAM_ENABLED !== "false",
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
  notifyOnTime: process.env.TELEGRAM_NOTIFY_ON_TIME === "true",
  notifyLate: process.env.TELEGRAM_NOTIFY_LATE !== "false",
  notifyVeryLate: process.env.TELEGRAM_NOTIFY_VERY_LATE !== "false",
};

export const formatLateTime = (totalMinutes: number): string => {
  if (!totalMinutes) return "0 នាទី";
  if (totalMinutes < 60) return `${totalMinutes} នាទី`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} ម៉ោង`;
  return `${hours} ម៉ោង ${mins} នាទី`;
};

export async function sendTelegramMessage(message: string, customChatId?: string) {
  const chatId = customChatId || TELEGRAM_CONFIG.chatId;
  const botToken = TELEGRAM_CONFIG.botToken;

  if (botToken && !/^[a-zA-Z0-9:_-]+$/.test(botToken)) {
    return { success: false, error: "Invalid botToken format" };
  }

  if (!TELEGRAM_CONFIG.enabled && !customChatId) {
    return { success: true, message: "Telegram notifications are disabled" };
  }

  if (!chatId || !botToken) {
    return { success: false, error: "Telegram not configured" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function processCheckinNotification(data: any) {
  const employeeName = data.employeeName || data.teacherName || data.name;
  const employeeId = data.employeeId || data.employee_id || data.id;
  const checkInTime = data.checkInTime || data.check_in || new Date().toISOString();
  const status = data.status || "on-time";
  const lateMinutes = data.lateMinutes || data.minutes || 0;
  const distance = data.distance || data.distance_from_school || null;

  if (!employeeName || !employeeId) {
    return { success: false, error: "Missing employee name or ID" };
  }

  if (status === "on-time" && !TELEGRAM_CONFIG.notifyOnTime) return { success: true };
  if (status === "late" && !TELEGRAM_CONFIG.notifyLate) return { success: true };
  if (status === "very-late" && !TELEGRAM_CONFIG.notifyVeryLate) return { success: true };

  const statusMap: Record<string, { emoji: string; khmer: string }> = {
    "on-time": { emoji: "✅", khmer: "ទាន់ពេល" },
    late: { emoji: "⚠️", khmer: "យឺត" },
    "very-late": { emoji: "🔴", khmer: "យឺតខ្លាំង" },
  };

  const { emoji, khmer } = statusMap[status] || { emoji: "📌", khmer: status };

  const timeFormatted = new Date(checkInTime).toLocaleTimeString("km-KH", {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  
  const dateFormatted = new Date().toLocaleDateString("km-KH", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let message = `
<b>🏢 ចុះវត្តមានថ្មី</b>

👤 <b>បុគ្គលិក:</b> ${employeeName}
🆔 <b>លេខសម្គាល់:</b> ${employeeId}
⏰ <b>ម៉ោង:</b> ${timeFormatted}
📊 <b>ស្ថានភាព:</b> ${emoji} ${khmer}
${lateMinutes > 0 ? `⏱️ <b>យឺត:</b> ${formatLateTime(lateMinutes)}` : ""}
${distance ? `📍 <b>ចម្ងាយ:</b> ${distance} ម៉ែត្រ` : ""}
📅 <b>កាលបរិច្ឆេទ:</b> ${dateFormatted}
  `.trim();

  if (status === "late" || status === "very-late") {
    message += `\n\n⚠️ <b>សូមចំណាំ:</b> បុគ្គលិកបានមកយឺត ${formatLateTime(lateMinutes)}`;
  }

  return await sendTelegramMessage(message);
}
