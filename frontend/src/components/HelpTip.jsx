import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

// A small contextual callout shown once per screen (`id`), explaining what that screen
// does — not one upfront tour, but a short note the first time each section is opened.
// "Got it" dismisses just this one; the "turn tips off" line kills all of them for good
// (S.tipsOff), with a Settings switch to bring them back if someone changes their mind.
export default function HelpTip({ id, text }) {
  const seen = useStore(s => !!s.S.tips?.[id])
  const off = useStore(s => !!s.S.tipsOff)
  const update = useStore(s => s.update)
  if (seen || off) return null

  const dismiss = () => update(s => { s.tips = { ...s.tips, [id]: true } })
  const disableAll = () => update(s => { s.tipsOff = true })

  return (
    <div className="helptip">
      <div className="helptip-row">
        <span className="helptip-i"><Icon name="lightbulb" /></span>
        <div className="helptip-body">{t(text)}</div>
        <button className="helptip-x" aria-label={t('Got it')} onClick={dismiss}><Icon name="xmark" /></button>
      </div>
      <div className="helptip-off">
        {t('Prefer to figure things out yourself?')}{' '}
        <button className="helptip-link" onClick={disableAll}>{t('Turn tips off here')}</button>
      </div>
    </div>
  )
}
