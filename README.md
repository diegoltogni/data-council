# The Data Council ⚡

5 AI analysts. 1 topic. Real charts. No mercy.

Watch AI analysts debate any topic in a WhatsApp-style group chat — streaming in real-time, dropping data visualizations mid-argument, and disagreeing passionately.

## The Analysts

| | Name | Style |
|---|---|---|
| 🎙️ | **The Moderator** | Facilitates, provokes, keeps it moving |
| 📊 | **The Quant** | Stats-obsessed, slightly smug, lives by the numbers |
| 👁️ | **The Eye Test** | Trusts the tape, values intangibles over spreadsheets |
| 📚 | **The Historian** | Era context, rule changes, the nuance everyone ignores |
| 🔥 | **The Hot Take** | Contrarian, provocative, says what everyone's thinking |

## Quick Start

```bash
git clone https://github.com/diegoltogni/data-council.git
cd data-council
cp .env.example .env.local    # add your Anthropic API key
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000) and pick a topic.

No API key? You can paste one directly in the app UI — it stays in your browser and is never sent to any server.

## Tech Stack

- **Next.js 16** + React 19 + TypeScript
- **AI SDK 6** with Claude Sonnet 4 (streaming)
- **Tailwind CSS 4** — WhatsApp-inspired dark theme
- **Recharts** — inline data visualizations
- **Vercel Analytics** — privacy-friendly tracking
- Zero external auth, state management, or database

## How It Works

1. You pick a topic (or type your own)
2. The Moderator opens the debate
3. Each analyst takes turns responding — text streams in real-time
4. Analysts can drop charts mid-argument to back up their points
5. After 2 rounds, the Moderator delivers the final verdict

Each agent has a detailed personality prompt and sees the full conversation context. The debate is genuinely unpredictable — agents disagree, challenge each other, and occasionally concede.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdiegoltogni%2Fdata-council&env=ANTHROPIC_API_KEY&envDescription=Get%20your%20API%20key%20at%20console.anthropic.com)

Or deploy anywhere that runs Node.js:

```bash
npm run build
npm start
```

## License

MIT — see [LICENSE](LICENSE).

---

Built on a Friday night by [Diego Togni](https://linkedin.com/in/diegoltogni).
