#!/usr/bin/env node
// Resolves a YouTube video (id + title) per exercise for the "sell" mobile build
// (VITE_MEDIA_MODE=youtube), so the app can show a real thumbnail + embedded player
// instead of the upstream Gymvisual media (not licensed for paid apps).
//
// The YouTube Data API free quota is 100 units per search — 100 searches/day on the
// default 10,000/day quota — so this is designed to run in batches across several
// days. Already-resolved exercises are skipped, so it's safe to re-run daily.
//
//   node --env-file=.env scripts/match-youtube-videos.mjs [--limit 90]

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { EXDB } from '../frontend/src/lib/exercises-data.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'frontend', 'src', 'lib', 'exercise-videos.json')

const apiKey = process.env.YOUTUBE_API_KEY
if (!apiKey) throw new Error('Set YOUTUBE_API_KEY first')

const limitArg = process.argv.indexOf('--limit')
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : 90

let resolved = {}
try {
  resolved = JSON.parse(readFileSync(outFile, 'utf8'))
} catch {
  // first run — no file yet
}

const pending = EXDB.filter(ex => !resolved[ex.id])
console.log(`${Object.keys(resolved).length} already resolved, ${pending.length} pending, doing up to ${limit} this run.`)

const sleep = ms => new Promise(r => setTimeout(r, ms))
let done = 0

for (const ex of pending) {
  if (done >= limit) break
  const q = encodeURIComponent(`"${ex.n}" ${ex.tg} exercise proper form`)
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&order=relevance&videoDuration=short&safeSearch=strict&q=${q}&key=${apiKey}`

  const res = await fetch(url)
  if (res.status === 403 || res.status === 429) {
    console.log(`Quota exhausted (HTTP ${res.status}) — stopping early, progress saved. Re-run tomorrow.`)
    break
  }
  if (!res.ok) {
    console.log(`HTTP ${res.status} for "${ex.n}" — skipping.`)
    continue
  }
  const data = await res.json()
  const item = data.items && data.items[0]
  if (item) {
    resolved[ex.id] = { videoId: item.id.videoId, title: item.snippet.title }
  } else {
    console.log(`No result for "${ex.n}".`)
  }
  done++
  if (done % 10 === 0) writeFileSync(outFile, JSON.stringify(resolved))
  await sleep(500)
}

writeFileSync(outFile, JSON.stringify(resolved))
const remaining = EXDB.length - Object.keys(resolved).length
console.log(`Done. ${Object.keys(resolved).length}/${EXDB.length} resolved, ${remaining} remaining.`)

// Local, one-time heads-up when the whole catalogue is done — nobody has to keep checking.
if (remaining === 0 && process.platform === 'win32') {
  execFile('msg', [process.env.USERNAME,
    `openGym: los ${EXDB.length} videos de ejercicios ya están emparejados. Listo para el próximo build.`])
}
