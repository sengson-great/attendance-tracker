import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from '@/lib/auth';
import { processCheckinNotification, sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ALL requests to this endpoint must be authenticated by an admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Admin session required." }, { status: 401 });
    }
    
    const payload = await verifySession(session.value);
    if (!payload?.admin) {
      return NextResponse.json({ success: false, error: "Unauthorized access: Admin session required." }, { status: 401 });
    }

    if (body.type === "test") {
      const message = `
<b>✅ សាកល្បងការតភ្ជាប់ Telegram</b>

🕐 <b>ម៉ោង:</b> ${new Date().toLocaleTimeString("km-KH")}
📊 <b>ប្រព័ន្ធ:</b> ប្រព័ន្ធចុះវត្តមានបុគ្គលិក
✨ <b>ស្ថានភាព:</b> ដំណើរការល្អ!
      `.trim();
      const result = await sendTelegramMessage(message);
      return NextResponse.json(result);
    } else if (body.type === "checkin") {
      const result = await processCheckinNotification(body);
      return NextResponse.json(result);
    } else {
      const { chatId, message } = body;
      if (!message) {
        return NextResponse.json({ success: false, error: "Missing message" }, { status: 400 });
      }
      const result = await sendTelegramMessage(message, chatId);
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}
