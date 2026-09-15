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
  { id: 'back-shoulders-20', query: '20 minute back and shoulders workout no equipment', videoDuration: 'medium' },
  { id: 'glutes-15', query: '15 minute glutes workout no equipment', videoDuration: 'medium' },
  { id: 'chest-triceps-20', query: '20 minute chest and triceps workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-beginner-15', query: '15 minute full body workout for absolute beginners', videoDuration: 'medium' },
  { id: 'bedtime-stretch-10', query: '10 minute bedtime stretch routine for flexibility', videoDuration: 'medium' },
  { id: 'plyo-cardio-20', query: '20 minute plyometric jump workout no equipment', videoDuration: 'medium' },
  { id: 'pilates-core-20', query: '20 minute pilates core workout no equipment', videoDuration: 'medium' },
  { id: 'dumbbell-full-body-30', query: '30 minute dumbbell full body workout at home', videoDuration: 'long' },
  { id: 'core-standing-10', query: '10 minute standing core workout no floor exercises', videoDuration: 'medium' },
  { id: 'obliques-15', query: '15 minute obliques workout no equipment', videoDuration: 'medium' },
  { id: 'core-beginner-10', query: '10 minute core workout for beginners no equipment', videoDuration: 'medium' },
  { id: 'dance-cardio-25', query: '25 minute dance cardio workout no equipment', videoDuration: 'medium' },
  { id: 'kickboxing-cardio-20', query: '20 minute kickboxing cardio workout no equipment', videoDuration: 'medium' },
  { id: 'hip-mobility-10', query: '10 minute hip mobility routine', videoDuration: 'medium' },
  { id: 'morning-stretch-10', query: '10 minute morning stretch routine full body', videoDuration: 'medium' },
  { id: 'arms-15', query: '15 minute arms toning workout no equipment', videoDuration: 'medium' },
  { id: 'shoulders-10', query: '10 minute shoulder workout no equipment', videoDuration: 'medium' },
  { id: 'legs-burn-20', query: '20 minute leg workout no equipment burn', videoDuration: 'medium' },
  { id: 'inner-thigh-15', query: '15 minute inner thigh workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-hiit-25', query: '25 minute full body HIIT workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-tabata-15', query: '15 minute tabata full body workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-warmup-10', query: '10 minute full body warm up workout before training', videoDuration: 'medium' },
  { id: 'full-body-athletic-20', query: '20 minute athletic full body workout no equipment', videoDuration: 'medium' },
  { id: 'full-body-express-10', query: '10 minute quick full body workout no equipment', videoDuration: 'medium' },
  { id: 'cardio-boxing-15', query: '15 minute cardio boxing workout no equipment', videoDuration: 'medium' },
  { id: 'cardio-walk-20', query: '20 minute walking workout at home no equipment', videoDuration: 'medium' },
  { id: 'cardio-tabata-15', query: '15 minute tabata style full body cardio HIIT workout no equipment', videoDuration: 'medium' },
  { id: 'cardio-beginner-15', query: '15 minute cardio workout for beginners no equipment', videoDuration: 'medium' },
  { id: 'cardio-fatburn-30', query: '30 minute fat burning cardio workout no equipment', videoDuration: 'long' },
  { id: 'shoulder-mobility-10', query: '10 minute shoulder mobility routine', videoDuration: 'medium' },
  { id: 'ankle-mobility-10', query: '10 minute ankle mobility routine', videoDuration: 'medium' },
  { id: 'full-body-stretch-15', query: '15 minute full body stretch routine for flexibility', videoDuration: 'medium' },
  { id: 'yoga-flow-20', query: '20 minute yoga flow for beginners no equipment', videoDuration: 'medium' },
  { id: 'core-tabata-15', query: '15 minute tabata core workout no equipment', videoDuration: 'medium' },
  { id: 'lower-abs-10', query: '10 minute lower abs workout no equipment', videoDuration: 'medium' },
  { id: 'plank-workout-10', query: '10 minute plank challenge workout no equipment', videoDuration: 'medium' },
  { id: 'core-flat-stomach-15', query: '15 minute flat stomach workout no equipment', videoDuration: 'medium' },
  { id: 'back-workout-15', query: '15 minute back workout no equipment bodyweight', videoDuration: 'medium' },
  { id: 'chest-workout-15', query: '15 minute chest workout no equipment bodyweight', videoDuration: 'medium' },
  { id: 'push-workout-20', query: '20 minute push workout upper body no equipment', videoDuration: 'medium' },
  { id: 'glutes-activation-10', query: '10 minute glute activation workout no equipment', videoDuration: 'medium' },
  { id: 'quads-15', query: '15 minute quad workout no equipment', videoDuration: 'medium' },
  { id: 'calves-10', query: '10 minute calf workout no equipment', videoDuration: 'medium' },
  { id: 'lower-body-burn-25', query: '25 minute lower body burn workout no equipment', videoDuration: 'long' },
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
