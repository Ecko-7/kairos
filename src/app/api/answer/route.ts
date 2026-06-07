import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { query, results } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "No search results available" }, { status: 400 });
    }

    const context = results
      .map((r: any, i: number) => `[${i + 1}] ${r.title}\n${r.content}`)
      .join("\n\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are Kairos. Answer questions clearly and cite your sources using [1], [2], etc.",
        },
        {
          role: "user",
          content: `Sources:\n${context}\n\nQuestion: ${query}`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
      sources: results.map((r: any) => ({ title: r.title, url: r.url })),
    });
  } catch (error: any) {
    console.error("Answer route error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch answer" }, { status: 500 });
  }
}
