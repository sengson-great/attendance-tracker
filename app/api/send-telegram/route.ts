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
  console.log("📨 Telegram API called");

  try {
    const body = await request.json();
    console.log("Request body:", body);

    if (body.type === "checkin") {
      return await sendCheckinNotification(body);
    } else if (body.type === "test") {
      return await sendTestMessage();
    } else {
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
  const {
    employeeName,
    employeeId,
    checkInTime,
    status,
    lateMinutes = 0,
  } = data;

  // Skip based on config
  if (status === "on-time" && !TELEGRAM_CONFIG.notifyOnTime) {
    return NextResponse.json({
      success: true,
      message: "Notification skipped (on-time disabled)",
    });
  }
  if (status === "late" && !TELEGRAM_CONFIG.notifyLate) {
    return NextResponse.json({
      success: true,
      message: "Notification skipped (late disabled)",
    });
  }
  if (status === "very-late" && !TELEGRAM_CONFIG.notifyVeryLate) {
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

  const message = `
<b>🏫 ចុះវត្តមានថ្មី</b>

👤 <b>បុគ្គលិក:</b> ${employeeName}
🆔 <b>លេខសម្គាល់:</b> ${employeeId}
⏰ <b>ម៉ោង:</b> ${new Date(checkInTime).toLocaleTimeString("km-KH")}
📊 <b>ស្ថានភាព:</b> ${emoji} ${khmer}
${lateMinutes > 0 ? `⏱️ <b>យឺត:</b> ${lateMinutes} នាទី` : ""}
📅 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleDateString("km-KH")}
  `.trim();

  return await sendTelegramMessage(message);
}

async function sendTestMessage() {
  const message = `
<b>✅ សាកល្បងការតភ្ជាប់ Telegram</b>

🕐 <b>ម៉ោង:</b> ${new Date().toLocaleTimeString("km-KH")}
📊 <b>ប្រព័ន្ធ:</b> ចុះវត្តមានក្រុមហ៊ុន ឬស្ថាប័ន
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
    return NextResponse.json({
      success: true,
      message: "Telegram notifications are disabled",
    });
  }

  if (!chatId || !botToken) {
    console.error("Telegram config missing:", {
      hasChatId: !!chatId,
      hasBotToken: !!botToken,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Telegram not configured (missing botToken or chatId)",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML", // ← Changed to HTML (more reliable with Khmer)
        }),
      },
    );

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API error:", data);
      return NextResponse.json(
        { success: false, error: data.description || "Telegram API error" },
        { status: 400 },
      );
    }

    console.log("✅ Telegram message sent successfully");
    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Telegram fetch error:", error);
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
