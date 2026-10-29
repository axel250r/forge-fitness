import { t } from '../lib/i18n.js'
import { SECTION_NOTICES } from '../lib/extra-exercises.js'
import Icon from './Icon.jsx'

// The safety notice of a Library section (isometric / pelvic / prenatal), in the HelpTip style
// but not dismissable: it stays for as long as the section is open, in the Library and on the
// matching Specialized sessions chip alike.
export default function SectionNotice({ sec }) {
  const n = SECTION_NOTICES[sec]
  if (!n) return null
  return <div className="helptip" style={{ marginBottom: 12 }}><div className="helptip-row"><span className="helptip-i"><Icon name={n.icon} /></span><div className="helptip-body">{t(n.text)}</div></div></div>
}
