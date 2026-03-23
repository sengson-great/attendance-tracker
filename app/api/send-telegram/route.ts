import { NextResponse } from "next/server";

const TELEGRAM_CONFIG = {
  enabled: true,
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
  notifyOnTime: false,
  notifyLate: true,
  notifyVeryLate: true,
};

export async function POST(request: Request) {
  console.log("📨 Telegram API called at:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Check for employeeName or teacherName (support both)
    if (body.employeeName || body.teacherName || body.type === "checkin") {
      return await sendCheckinNotification(body);
    } 
    else if (body.type === "test") {
      return await sendTestMessage();
    } 
    else {
      return await sendCustomMessage(body);
    }
  } catch (error) {
    console.error("❌ Telegram API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

async function sendCheckinNotification(data: any) {
  // Support both field names (employeeName or teacherName)
  const employeeName = data.employeeName || data.teacherName || data.name;
  const employeeId = data.employeeId || data.employee_id || data.id;
  const checkInTime = data.checkInTime || data.check_in || new Date().toISOString();
  const status = data.status || "on-time";
  const lateMinutes = data.lateMinutes || data.minutes || 0;
  const distance = data.distance || data.distance_from_school || null;

  console.log("📤 Processing check-in notification:", {
    employeeName,
    employeeId,
    checkInTime,
    status,
    lateMinutes,
    distance
  });

  if (!employeeName || !employeeId) {
    console.error("❌ Missing required fields:", { employeeName, employeeId });
    return NextResponse.json(
      { success: false, error: "Missing employee name or ID" },
      { status: 400 }
    );
  }

  // Skip based on config
  if (status === "on-time" && !TELEGRAM_CONFIG.notifyOnTime) {
    console.log("⏭️ Skipping on-time notification (disabled in config)");
    return NextResponse.json({
      success: true,
      message: "Notification skipped (on-time disabled)",
    });
  }
  if (status === "late" && !TELEGRAM_CONFIG.notifyLate) {
    console.log("⏭️ Skipping late notification (disabled in config)");
    return NextResponse.json({
      success: true,
      message: "Notification skipped (late disabled)",
    });
  }
  if (status === "very-late" && !TELEGRAM_CONFIG.notifyVeryLate) {
    console.log("⏭️ Skipping very-late notification (disabled in config)");
    return NextResponse.json({
      success: true,
      message: "Notification skipped (very-late disabled)",
    });
  }

  const statusMap: Record<string, { emoji: string; khmer: string }> = {
    "on-time": { emoji: "✅", khmer: "ទាន់ពេល" },
    late: { emoji: "⚠️", khmer: "យឺត" },
    "very-late": { emoji: "🔴", khmer: "យឺតខ្លាំង" },
  };

  const { emoji, khmer } = statusMap[status] || { emoji: "📌", khmer: status };

  const timeFormatted = new Date(checkInTime).toLocaleTimeString("km-KH", {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const dateFormatted = new Date().toLocaleDateString("km-KH", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `
<b>🏢 ចុះវត្តមានថ្មី</b>

👤 <b>បុគ្គលិក:</b> ${employeeName}
🆔 <b>លេខសម្គាល់:</b> ${employeeId}
⏰ <b>ម៉ោង:</b> ${timeFormatted}
📊 <b>ស្ថានភាព:</b> ${emoji} ${khmer}
${lateMinutes > 0 ? `⏱️ <b>យឺត:</b> ${lateMinutes} នាទី` : ""}
${distance ? `📍 <b>ចម្ងាយ:</b> ${distance} ម៉ែត្រ` : ""}
📅 <b>កាលបរិច្ឆេទ:</b> ${dateFormatted}
  `.trim();

  // If it's a late arrival, add a warning
  if (status === "late" || status === "very-late") {
    message += `\n\n⚠️ <b>សូមចំណាំ:</b> បុគ្គលិកបានមកយឺត ${lateMinutes} នាទី`;
  }

  return await sendTelegramMessage(message);
}

async function sendTestMessage() {
  const message = `
<b>✅ សាកល្បងការតភ្ជាប់ Telegram</b>

🕐 <b>ម៉ោង:</b> ${new Date().toLocaleTimeString("km-KH")}
📊 <b>ប្រព័ន្ធ:</b> ប្រព័ន្ធចុះវត្តមានបុគ្គលិក
✨ <b>ស្ថានភាព:</b> ដំណើរការល្អ!
  `.trim();

  return await sendTelegramMessage(message);
}

async function sendCustomMessage(data: any) {
  const { chatId, message, botToken } = data;

  if (!chatId || !message) {
    return NextResponse.json(
      { success: false, error: "Missing chatId or message" },
      { status: 400 },
    );
  }

  return await sendTelegramMessage(message, chatId, botToken);
}

async function sendTelegramMessage(
  message: string,
  customChatId?: string,
  customBotToken?: string,
) {
  const chatId = customChatId || TELEGRAM_CONFIG.chatId;
  const botToken = customBotToken || TELEGRAM_CONFIG.botToken;

  if (!TELEGRAM_CONFIG.enabled && !customChatId) {
    console.log("ℹ️ Telegram notifications are disabled");
    return NextResponse.json({
      success: true,
      message: "Telegram notifications are disabled",
    });
  }

  if (!chatId || !botToken) {
    console.error("❌ Telegram config missing:", {
      hasChatId: !!chatId,
      hasBotToken: !!botToken,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Telegram not configured (missing botToken or chatId)",
        config: {
          hasChatId: !!chatId,
          hasBotToken: !!botToken,
          enabled: TELEGRAM_CONFIG.enabled
        }
      },
      { status: 400 },
    );
  }

  try {
    console.log(`📤 Sending to Telegram chat: ${chatId}`);
    console.log(`📤 Message length: ${message.length} characters`);
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      },
    );

    const data = await response.json();
    console.log("📥 Telegram API response:", JSON.stringify(data, null, 2));

    if (!data.ok) {
      console.error("❌ Telegram API error:", data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.description || "Telegram API error",
          details: data
        },
        { status: 400 },
      );
    }

    console.log("✅ Telegram message sent successfully");
    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("💥 Telegram fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send message to Telegram",
        details: String(error),
      },
      { status: 500 },
    );
  }
}