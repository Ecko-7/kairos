import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.TAVILY_API_KEY) {
      console.error('TAVILY_API_KEY is not set');
      return NextResponse.json({ error: 'Search service not configured' }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 10,
        include_answer: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error('Tavily error:', res.status, res.statusText);
      return NextResponse.json({ error: 'Search failed' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data.results ?? []);

  } catch (error: any) {
    console.error('Search route error:', error?.message || error);
    return NextResponse.json({ error: 'Search service unavailable' }, { status: 500 });
  }
}
