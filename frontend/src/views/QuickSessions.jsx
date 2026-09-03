import { useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n.js'
import { QUICK_SESSIONS, quickSessionUrl, quickSessionThumb } from '../lib/quick-sessions.js'
import { isQuickSessionLocked } from '../lib/paywall.js'
import { paywallSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import HelpTip from '../components/HelpTip.jsx'

// Its own screen rather than a list bolted onto the bottom of Start workout (issue: these
// aren't logged routines, they're YouTube follow-alongs — mixing the two made the real "Start
// workout" flow feel cluttered, and boxed the list to whatever fit on that screen). Lives here
// so the curated list (lib/quick-sessions.js) can grow over time with its own room to do so.
export default function QuickSessions() {
  const nav = useNavigate()
  return <>
    <div className="hdr"><button className="iconbtn" onClick={() => nav('/workout')} aria-label={t('Start workout')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 12 }}><h1>{t('Short on time')}</h1><div className="sub">{t('{0} full workouts, one video each', QUICK_SESSIONS.length)}</div></div></div>
    <HelpTip id="quickSessions" text="No time for a full logged workout? Pick one of these and follow along — it opens straight in YouTube, no setup here." />
    <div className="list">
      {QUICK_SESSIONS.map(s => {
        const locked = isQuickSessionLocked(s)
        const row = <>
          <img className="thumb" loading="lazy" decoding="async" src={quickSessionThumb(s)} alt="" />
          <div className="grow"><div className="tt">{t(s.focus)}</div><div className="ss">{t('{0} min · Follow along on YouTube', s.minutes)}</div></div>
          <Icon name={locked ? 'lock' : 'play'} className="chev" />
        </>
        return locked
          ? <div key={s.id} className="item" onClick={() => paywallSheet()}>{row}</div>
          : <a key={s.id} className="item" href={quickSessionUrl(s)} target="_blank" rel="noopener noreferrer">{row}</a>
      })}
    </div>
  </>
}
