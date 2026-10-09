# Replicant Interrogation

A six-turn empathy test game powered by Groq's Qwen3 32B model and built with Next.js App Router, Tailwind CSS, and Vercel.

## Local setup

```bash
cd ~/Documents/WWW
npx create-next-app@latest replicant-interrogation --ts --tailwind --app --eslint --use-npm
cd replicant-interrogation
npm install groq-sdk
# Replace generated files with the files in this repository, then add your key:
printf "GROQ_API_KEY=your_key_here\n" > .env.local
npm run dev
```

Place `icon.ico`, `icon.svg`, `favicon.ico`, and `favicon.svg` inside `public/`. The metadata in `app/layout.tsx` references all four assets.

## Deploy

```bash
npm run build
gh auth status
gh repo create Ajxrhaider/replicant-interrogation --public --source=. --remote=origin --push
vercel --prod
```

Set `GROQ_API_KEY` in Vercel Project Settings → Environment Variables before testing production.

## License

MIT. See `LICENSE`.
