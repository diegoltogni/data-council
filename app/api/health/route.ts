export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const hasServerKey = !!key && key !== 'your-api-key-here';

  return Response.json({ hasServerKey });
}
