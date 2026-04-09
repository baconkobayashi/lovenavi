import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Relation = 'matching' | 'chatted' | 'met' | 'dating'
type Area = '東京' | '神奈川' | '大阪' | '名古屋' | 'その他'
type Tone = 'aggressive' | 'reserved' | 'humorous' | 'sincere'
type Job = '会社員' | 'フリーランス' | '公務員' | '経営者・自営業' | 'その他'

const RELATIONS: { key: Relation; label: string; sub: string }[] = [
  { key: 'matching', label: 'マッチング直後', sub: 'まだ会話していない' },
  { key: 'chatted', label: '数回やり取り済み', sub: '少し話したことある' },
  { key: 'met', label: '会ったことある', sub: 'オフラインで会った' },
  { key: 'dating', label: '付き合い中', sub: '交際中のやり取り' },
]

const AREAS: Area[] = ['東京', '神奈川', '大阪', '名古屋', 'その他']

const TONES: { key: Tone; label: string; sub: string }[] = [
  { key: 'aggressive', label: '積極的', sub: 'グイグイいくタイプ' },
  { key: 'reserved', label: '控えめ', sub: 'ゆっくり距離を縮める' },
  { key: 'humorous', label: 'ユーモア系', sub: '笑いを取りに行く' },
  { key: 'sincere', label: '誠実系', sub: '真面目・丁寧な印象' },
]

const JOBS: Job[] = ['会社員', 'フリーランス', '公務員', '経営者・自営業', 'その他']

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#534AB7"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4M8 5.5v.5" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="#1a1a18"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M9 2L4 7l5 5" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="#888780"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 5.5L6 1l5 4.5V11a.5.5 0 01-.5.5h-3V8H4.5v3.5h-3A.5.5 0 011 11V5.5z" />
    </svg>
  )
}

interface BadgeProps {
  label: string
  required: boolean
}
function Badge({ label, required }: BadgeProps) {
  if (required)
    return (
      <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger-text">
        {label}
      </span>
    )
  return <span className="text-[10px] text-ink-tertiary">{label}</span>
}

export default function FirstApproachPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [relation, setRelation] = useState<Relation>('matching')
  const [age, setAge] = useState(25)
  const [area, setArea] = useState<Area>('東京')
  const [hobbies, setHobbies] = useState('')
  const [profileText, setProfileText] = useState('')
  const [myAge, setMyAge] = useState(28)
  const [myJob, setMyJob] = useState<Job>('会社員')
  const [myHobbies, setMyHobbies] = useState('')
  const [tone, setTone] = useState<Tone>('aggressive')

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* ステップ1 */}
        <div className="frame mb-4">
          <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
            <button
              onClick={() => navigate('/home')}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent"
            >
              <BackIcon />
            </button>
            <span className="flex-1 text-[15px] font-medium">初回アプローチを作る</span>
            <span className="text-xs text-ink-tertiary">1 / 2</span>
            <button
              onClick={() => navigate('/home')}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary"
            >
              <HomeIcon />
              ホーム
            </button>
          </div>

          {/* プログレスバー */}
          <div className="h-[3px] bg-surface">
            <div
              className="h-full rounded-r-sm bg-brand"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <div className="p-4">
            <p className="mb-3 border-b border-black/10 pb-2 text-[13px] font-medium text-ink-secondary">
              相手のプロフィール情報
            </p>

            {/* 関係値 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                関係値 <Badge label="必須" required />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONS.map(({ key, label, sub }) => (
                  <button
                    key={key}
                    onClick={() => setRelation(key)}
                    className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${
                      relation === key ? 'border-brand-border bg-brand-light' : 'border-black/10'
                    }`}
                  >
                    <p
                      className={`mb-0.5 text-xs font-medium ${relation === key ? 'text-brand-dark' : 'text-ink'}`}
                    >
                      {label}
                    </p>
                    <span className="text-[11px] text-ink-secondary">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 年齢 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                年齢 <Badge label="必須" required />
              </p>
              <div className="flex items-center gap-[10px]">
                <input
                  type="range"
                  min={18}
                  max={45}
                  value={age}
                  step={1}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="min-w-[28px] text-right text-[13px] font-medium">{age}</span>
                <span className="text-xs text-ink-secondary">歳</span>
              </div>
            </div>

            {/* 居住エリア */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                居住エリア <Badge label="任意" required={false} />
              </p>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className={`cursor-pointer rounded-full border px-[14px] py-1.5 text-xs transition-all ${
                      area === a
                        ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                        : 'border-black/20 bg-transparent text-ink'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* 趣味 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                趣味・好きなこと <Badge label="任意" required={false} />
              </p>
              <textarea
                rows={3}
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder={'例：カフェ巡り、映画鑑賞、ヨガ\nプロフィール文をそのままコピペでもOK'}
              />
              <p className="mt-1 text-[11px] text-ink-tertiary">入れるほど精度が上がります</p>
            </div>

            {/* プロフィール文 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                プロフィール文（あれば） <Badge label="任意" required={false} />
              </p>
              <textarea
                rows={3}
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="例：週末はよくカフェでのんびりしています。旅行も好きで去年は京都に行きました。"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full cursor-pointer rounded-md border-none bg-brand py-[13px] text-sm font-medium text-brand-light"
            >
              次へ　→
            </button>
          </div>
        </div>

        {/* ステップ2 */}
        <div className="frame">
          <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
            <button
              onClick={() => setStep(1)}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent"
            >
              <BackIcon />
            </button>
            <span className="flex-1 text-[15px] font-medium">初回アプローチを作る</span>
            <span className="text-xs text-ink-tertiary">2 / 2</span>
            <button
              onClick={() => navigate('/home')}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary"
            >
              <HomeIcon />
              ホーム
            </button>
          </div>

          {/* プログレスバー 100% */}
          <div className="h-[3px] bg-surface">
            <div className="h-full w-full rounded-r-sm bg-brand" />
          </div>

          <div className="p-4">
            <p className="mb-3 border-b border-black/10 pb-2 text-[13px] font-medium text-ink-secondary">
              あなたの情報・キャラ設定
            </p>

            {/* Tip */}
            <div className="mb-4 flex items-start gap-2 rounded-md bg-brand-light p-[10px_12px]">
              <InfoIcon />
              <span className="text-[11px] leading-[1.5] text-brand-dark">
                入力した情報はマイページに保存されます。次回以降は自動で入力されます。
              </span>
            </div>

            {/* 年齢 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                年齢 <Badge label="必須" required />
              </p>
              <div className="flex items-center gap-[10px]">
                <input
                  type="range"
                  min={18}
                  max={50}
                  value={myAge}
                  step={1}
                  onChange={(e) => setMyAge(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="min-w-[28px] text-right text-[13px] font-medium">{myAge}</span>
                <span className="text-xs text-ink-secondary">歳</span>
              </div>
            </div>

            {/* 職業 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                職業 <Badge label="任意" required={false} />
              </p>
              <select value={myJob} onChange={(e) => setMyJob(e.target.value as Job)}>
                {JOBS.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </div>

            {/* 趣味 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                趣味・好きなこと <Badge label="任意" required={false} />
              </p>
              <textarea
                rows={2}
                value={myHobbies}
                onChange={(e) => setMyHobbies(e.target.value)}
                placeholder="例：サッカー、映画、料理"
              />
            </div>

            {/* キャラ設定 */}
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                キャラ設定（トーン） <Badge label="必須" required />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(({ key, label, sub }) => (
                  <button
                    key={key}
                    onClick={() => setTone(key)}
                    className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${
                      tone === key ? 'border-brand-border bg-brand-light' : 'border-black/10'
                    }`}
                  >
                    <p
                      className={`mb-0.5 text-xs font-medium ${tone === key ? 'text-brand-dark' : 'text-ink'}`}
                    >
                      {label}
                    </p>
                    <span className="text-[11px] text-ink-secondary">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="cursor-pointer whitespace-nowrap rounded-md border border-black/20 bg-transparent px-4 py-[13px] text-sm text-ink-secondary"
              >
                ← 戻る
              </button>
              <button
                onClick={() => navigate('/result')}
                className="flex-1 cursor-pointer rounded-md border-none bg-brand py-[13px] text-sm font-medium text-brand-light"
              >
                メッセージを生成する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
