import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, knowledge, rules, history } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-api-key-here") {
      return NextResponse.json(
        { error: "Claude API key niet geconfigureerd. Voeg je API key toe aan .env.local" },
        { status: 500 }
      );
    }

    // Build the system prompt with knowledge and rules
    let systemPrompt = "Je bent een behulpzame assistent.";

    if (knowledge || rules) {
      systemPrompt = `Je bent een behulpzame assistent voor een bedrijf.

${rules ? `## Regels voor hoe je moet reageren:\n${rules}\n\n` : ""}
${knowledge ? `## Kennis die je moet gebruiken:\n${knowledge}` : ""}

Beantwoord vragen op basis van bovenstaande kennis en regels. Als je het antwoord niet weet op basis van de gegeven kennis, geef dat eerlijk aan.`;
    }

    // Convert history to Anthropic message format
    const messages = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })) || [];

    // Add the current message
    messages.push({ role: "user" as const, content: message });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    return NextResponse.json({
      response: assistantMessage,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het genereren van een antwoord." },
      { status: 500 }
    );
  }
}
