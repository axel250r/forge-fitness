#!/usr/bin/env node
// Resolves one real YouTube video per curated "Quick Session" (the Short on time follow-along
// workouts) — a tiny, one-shot sibling of match-youtube-videos.mjs. Only ~8 queries total, so
// unlike the exercise matcher this runs to completion in a single call and needs no scheduling.
// Safe to re-run: already-resolved sessions are skipped.
//
//   node --env-file=.env scripts/match-quick-sessions.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'frontend', 'src', 'lib', 'quick-sessions.json')

const apiKey = process.env.YOUTUBE_API_KEY
if (!apiKey) throw new Error('Set YOUTUBE_API_KEY first')

// The curated list itself (focus/minutes/free-tier) lives in frontend/src/lib/quick-sessions.js —
// this is just the search query used to find one good video per entry.
export const SESSIONS = [
  { id: 'full-body-20', query: '20 minute full body workout no equipment', videoDuration: 'medium' },
  { id: 'cardio-hiit-20', query: '20 minute HIIT cardio workout no equipment', videoDuration: 'medium' },
  { id: 'mobility-10', query: '10 minute full body mobility stretch routine', videoDuration: 'medium' },
  { id: 'abs-core-15', query: '15 minute abs core workout no equipment', videoDuration: 'medium' },
  { id: 'upper-body-25', query: '25 minute upper body dumbbell workout at home', videoDuration: 'medium' },
  { id: 'lower-body-20', query: '20 minute lower body workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-30', query: '30 minute full body workout for beginners no equipment', videoDuration: 'long' },
  { id: 'low-impact-cardio-30', query: '30 minute low impact cardio workout no jumping', videoDuration: 'long' },
]

let resolved = {}
try { resolved = JSON.parse(readFileSync(outFile, 'utf8')) } catch { /* first run */ }

const pending = SESSIONS.filter(s => !resolved[s.id])
console.log(`${Object.keys(resolved).length} already resolved, ${pending.length} pending.`)

for (const s of pending) {
  const q = encodeURIComponent(s.query)
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&order=relevance&videoDuration=${s.videoDuration}&safeSearch=strict&q=${q}&key=${apiKey}`
  const res = await fetch(url)
  if (res.status === 403 || res.status === 429) {
    console.log(`Quota exhausted (HTTP ${res.status}) — stopping, progress saved.`)
    break
  }
  if (!res.ok) { console.log(`HTTP ${res.status} for "${s.query}" — skipping.`); continue }
  const data = await res.json()
  const item = data.items && data.items[0]
  if (item) {
    resolved[s.id] = { videoId: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle }
    console.log(`✓ ${s.id}: ${item.snippet.title} (${item.snippet.channelTitle})`)
  } else {
    console.log(`No result for "${s.query}".`)
  }
}

writeFileSync(outFile, JSON.stringify(resolved, null, 2) + '\n')
console.log(`Done. ${Object.keys(resolved).length}/${SESSIONS.length} resolved.`)
