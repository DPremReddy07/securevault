import { NextResponse } from "next/server";

export async function POST(request) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { text: "AI assistant is not configured. Add ANTHROPIC_API_KEY to your .env.local file to enable it." },
      { status: 200 }
    );
  }

  try {
    const { question, context } = await request.json();

    const systemPrompt = `You are an AI security assistant for SecureVault, a privacy-first encrypted file vault. Be concise, friendly, and security-focused.

The user's vault currently contains:
- Files (${context.fileCount} total): ${context.files?.join(", ") || "none"}
- Active threats: ${context.threats?.join("; ") || "none"}
- Password entries for: ${context.passwords?.join(", ") || "none"}
- Login history: ${context.loginHistory?.join(", ") || "none"}

Give actionable, specific advice based on the user's actual data above. Format with line breaks where helpful. Keep responses under 150 words. Use **bold** for important terms.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Anthropic API error");
    }

    const text = data.content?.[0]?.text || "Sorry, I could not process that.";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[AI route error]", err);
    return NextResponse.json(
      { text: "Sorry, I encountered an error. Please try again in a moment." },
      { status: 200 }
    );
  }
}
