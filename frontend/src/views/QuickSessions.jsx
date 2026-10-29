import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { QUICK_SESSIONS, QUICK_SESSION_FOCUSES, SPECIAL_SESSIONS, SPECIAL_SESSION_FOCUSES, quickSessionUrl, quickSessionThumb } from '../lib/quick-sessions.js'
import { SECTION_OF_FOCUS } from '../lib/extra-exercises.js'
import { isQuickSessionLocked } from '../lib/paywall.js'
import { paywallSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import HelpTip from '../components/HelpTip.jsx'
import SectionNotice from '../components/SectionNotice.jsx'

// Its own screen rather than a list bolted onto the bottom of Start workout (issue: these
// aren't logged routines, they're YouTube follow-alongs — mixing the two made the real "Start
// workout" flow feel cluttered, and boxed the list to whatever fit on that screen). Lives here
// so the curated list (lib/quick-sessions.js) can grow over time with its own room to do so.
// The same screen also serves the Specialized sessions (isometric, pelvic floor, pregnancy) when
// opened with ?group=special — a separate entry so they are easy to find — and a ?focus=… that
// comes from the matching Library section.
export default function QuickSessions() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const special = params.get('group') === 'special'
  const sessions = special ? SPECIAL_SESSIONS : QUICK_SESSIONS
  const focuses = special ? SPECIAL_SESSION_FOCUSES : QUICK_SESSION_FOCUSES
  useStore(s => s.premium) // re-render when VigorUp Premium status changes (lib/paywall.js isQuickSessionLocked)
  // Focus filter, same chip pattern as Library's body-part filter — kept local to this screen,
  // not derived from the exercise library's own categories.
  // The specialized sessions have no "All" view: each focus carries its own safety notice, so
  // one is always selected (the one asked for, else the first).
  const [focus, setFocus] = useState(() => focuses.includes(params.get('focus')) ? params.get('focus') : special ? focuses[0] : '')
  const shown = sessions.filter(s => !focus || s.focus === focus)
  return <>
    <div className="hdr"><button className="iconbtn" onClick={() => nav('/workout')} aria-label={t('Start workout')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 12 }}><h1>{t(special ? 'Specialized sessions' : 'Short on time')}</h1><div className="sub">{special ? t('{0} videos: isometric, pelvic floor and pregnancy', sessions.length) : t('{0} full workouts, one video each', sessions.length)}</div></div></div>
    {special
      ? <HelpTip id="specialSessions" text="Follow-along videos for isometric holds, pelvic floor and pregnancy. Each one opens straight in YouTube." />
      : <HelpTip id="quickSessions" text="No time for a full logged workout? Pick one of these and follow along — it opens straight in YouTube, no setup here." />}
    <div className="chips" style={{ marginBottom: 12 }}>
      {!special && <button className={'chip nocap' + (!focus ? ' on' : '')} onClick={() => setFocus('')}>{t('All')}</button>}
      {focuses.map(f => <button key={f} className={'chip' + (focus === f ? ' on' : '')} onClick={() => setFocus(f)}>{t(f)}</button>)}
    </div>
    <SectionNotice sec={SECTION_OF_FOCUS[focus]} />
    <div className="list">
      {shown.map(s => {
        const locked = isQuickSessionLocked(s)
        const row = <>
          <img className="thumb" loading="lazy" decoding="async" src={quickSessionThumb(s)} alt="" />
          {/* Several specialized videos share a focus, so those rows say who made each one — the creator matters more for pregnancy and pelvic floor than for a generic workout. */}
          <div className="grow"><div className="tt">{special ? s.title : t(s.focus)}</div><div className="ss">{special && s.channel ? s.channel + ' · ' : ''}{t('{0} min · Follow along on YouTube', s.minutes)}</div></div>
          <Icon name={locked ? 'lock' : 'play'} className="chev" />
        </>
        return locked
          ? <div key={s.id} className="item" onClick={() => paywallSheet()}>{row}</div>
          : <a key={s.id} className="item" href={quickSessionUrl(s)} target="_blank" rel="noopener noreferrer">{row}</a>
      })}
    </div>
  </>
}
