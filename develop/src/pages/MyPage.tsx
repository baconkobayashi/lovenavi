import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'
import { type Tone, type Job, MY_TONES, JOBS } from '../lib/constants'

type ResultTag = 'yes' | 'no' | 'pending'

interface HistoryItem {
  type: 'first' | 'reply'
  date: string
  text: string
  result: ResultTag | null
  nickname: string | null
  targetId: string | null
}

function formatRelativeDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  return `${diff}日前`
}

const RESULT_STYLES: Record<ResultTag, { bg: string; text: string; label: string }> = {
  yes: { bg: 'bg-success-bg', text: 'text-success-text', label: '返信きた' },
  no: { bg: 'bg-danger-bg', text: 'text-danger-text', label: '既読スルー' },
  pending: { bg: 'bg-warn-bg', text: 'text-warn-text', label: 'まだ待ち中' },
}

function IconFirst() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#534AB7"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 8C2 4.7 4.7 2 8 2s6 2.7 6 6-2.7 6-6 6H2.5L2 14V8z" />
    </svg>
  )
}

function IconReply() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#0F6E56"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="12" height="9" rx="1.5" />
      <path d="M2 7l6 4 6-4" />
    </svg>
  )
}

interface Profile {
  my_age: number | null
  my_job: string | null
  my_hobbies: string | null
  tone: string | null
}

export default function MyPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [initial, setInitial] = useState('?')
  const [profile, setProfile] = useState<Profile>({
    my_age: null,
    my_job: null,
    my_hobbies: null,
    tone: null,
  })
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)
  const [replyRate, setReplyRate] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [editAge, setEditAge] = useState(28)
  const [editJob, setEditJob] = useState<Job>('会社員')
  const [editHobbies, setEditHobbies] = useState('')
  const [editTone, setEditTone] = useState<Tone>('sincere')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      setInitial((user.email ?? '?')[0].toUpperCase())

      const { data: profileData } = await supabase
        .from('profiles')
        .select('my_age, my_job, my_hobbies, tone')
        .eq('user_id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      // 今月の生成数・返信率
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const { data: messages } = await supabase
        .from('messages')
        .select('feedback')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
      if (messages) {
        setGeneratedCount(messages.length)
        const withFeedback = messages.filter((m) => m.feedback !== null)
        const replied = messages.filter((m) => m.feedback === 'yes')
        setReplyRate(
          withFeedback.length > 0 ? Math.round((replied.length / withFeedback.length) * 100) : null,
        )
      }

      // 直近3件の履歴（使ったもの）
      const { data: recent } = await supabase
        .from('messages')
        .select('type, used_message, feedback, created_at, target_id, targets(nickname)')
        .eq('user_id', user.id)
        .not('used_message', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)
      if (recent) {
        setHistory(
          recent.map((m) => {
            const t = Array.isArray(m.targets) ? (m.targets[0] ?? null) : m.targets
            return {
              type: m.type === 'first_approach' ? 'first' : 'reply',
              date: formatRelativeDate(m.created_at),
              text: m.used_message,
              result: m.feedback as ResultTag | null,
              nickname: (t as { nickname: string } | null)?.nickname ?? null,
              targetId: m.target_id ?? null,
            }
          }),
        )
      }
    }
    load()
  }, [])

  function openProfileSheet() {
    setEditAge(profile.my_age ?? 28)
    setEditJob((profile.my_job as Job) ?? '会社員')
    setEditHobbies(profile.my_hobbies ?? '')
    setEditTone((profile.tone as Tone) ?? 'sincere')
    setShowProfileSheet(true)
  }

  async function saveProfile() {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        my_age: editAge,
        my_job: editJob,
        my_hobbies: editHobbies,
        tone: editTone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    setProfile({ my_age: editAge, my_job: editJob, my_hobbies: editHobbies, tone: editTone })
    setSaving(false)
    setShowProfileSheet(false)
  }

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8 pb-[64px]">
      <div className="w-full max-w-[400px]">
        <div className="frame">
          {/* ナビ */}
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-[14px]">
            <span className="text-[15px] font-medium">マイページ</span>
            <button
              onClick={openProfileSheet}
              className="cursor-pointer rounded-md border border-brand-border bg-transparent px-[10px] py-1 text-xs text-brand"
            >
              プロフィール編集
            </button>
          </div>

          {/* プロフィールヘッダー */}
          <div className="flex items-center gap-[14px] border-b border-black/10 px-4 py-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-light text-xl font-medium text-brand">
              {initial}
            </div>
            <div>
              <p className="mb-1 text-[17px] font-medium text-ink">{email}</p>
            </div>
          </div>

          {/* 利用サマリー */}
          <div className="grid grid-cols-3 border-b border-black/10">
            {[
              {
                val: generatedCount !== null ? String(generatedCount) : '—',
                label: '生成数（今月）',
              },
              { val: replyRate !== null ? `${replyRate}%` : '—', label: '返信率' },
              { val: '—', label: 'デート獲得数' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="border-r border-black/10 px-3 py-[14px] text-center last:border-r-0"
              >
                <p className="mb-0.5 text-xl font-medium text-ink">{val}</p>
                <p className="text-[11px] text-ink-secondary">{label}</p>
              </div>
            ))}
          </div>

          {/* 基本情報 */}
          <div className="border-b border-black/10 p-4">
            <p className="mb-3 text-xs font-medium text-ink-secondary">あなたの基本情報</p>
            {[
              { label: '年齢', value: profile.my_age ? `${profile.my_age}歳` : '未設定' },
              { label: '職業', value: profile.my_job ?? '未設定' },
              { label: '趣味', value: profile.my_hobbies ?? '未設定' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-black/10 py-2 last:border-b-0"
              >
                <span className="text-[13px] text-ink-secondary">{label}</span>
                <span className="text-[13px] font-medium text-ink">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-ink-secondary">キャラ設定</span>
              {profile.tone ? (
                <span className="rounded-full bg-brand-light px-[10px] py-[3px] text-[11px] font-medium text-brand-dark">
                  {profile.tone === 'aggressive'
                    ? '積極的'
                    : profile.tone === 'reserved'
                      ? '控えめ'
                      : profile.tone === 'humorous'
                        ? 'ユーモア系'
                        : '誠実系'}
                </span>
              ) : (
                <span className="text-[13px] font-medium text-ink">未設定</span>
              )}
            </div>
          </div>

          {/* 生成履歴 */}
          <div className="border-b border-black/10 p-4">
            <p className="mb-3 text-xs font-medium text-ink-secondary">最近の履歴（使ったもの）</p>
            {history.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-tertiary">履歴がありません</p>
            ) : (
              history.map(({ type, date, text, result, nickname, targetId }, i) => {
                const style = result ? RESULT_STYLES[result] : null
                return (
                  <div
                    key={i}
                    onClick={() => targetId && navigate('/reply', { state: { targetId } })}
                    className={`flex items-start gap-3 border-b border-black/10 py-[10px] last:border-b-0 ${targetId ? 'cursor-pointer transition-colors hover:bg-surface' : ''}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${type === 'first' ? 'bg-brand-light' : 'bg-[#E1F5EE]'}`}
                    >
                      {type === 'first' ? <IconFirst /> : <IconReply />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-[3px] flex items-center">
                        <span
                          className={`text-[11px] font-medium ${type === 'first' ? 'text-brand' : 'text-[#0F6E56]'}`}
                        >
                          {type === 'first' ? '初回アプローチ' : '返信'}
                        </span>
                        {nickname && (
                          <>
                            <span className="mx-1 text-[10px] text-ink-tertiary">·</span>
                            <span className="text-[11px] font-medium text-ink-secondary">
                              {nickname}
                            </span>
                          </>
                        )}
                        <span className="ml-auto text-[11px] text-ink-tertiary">{date}</span>
                      </div>
                      <p className="mb-1 text-xs leading-[1.5] text-ink">{text}</p>
                      <div className="flex items-center gap-2">
                        {style ? (
                          <span
                            className={`inline-block rounded-full px-2 py-[2px] text-[10px] ${style.bg} ${style.text}`}
                          >
                            {style.label}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-surface px-2 py-[2px] text-[10px] text-ink-tertiary">
                            フィードバック未記録
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* アカウント設定 */}
          <div className="border-b border-black/10 p-4">
            <p className="mb-3 text-xs font-medium text-ink-secondary">アカウント設定</p>
            {[
              { label: '利用規約', danger: false, onClick: undefined },
              { label: 'プライバシーポリシー', danger: false, onClick: undefined },
              { label: 'お問い合わせ', danger: false, onClick: undefined },
              {
                label: 'ログアウト',
                danger: false,
                onClick: async () => {
                  await supabase.auth.signOut()
                  navigate('/')
                },
              },
              { label: '退会する', danger: true, onClick: undefined },
            ].map(({ label, danger, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                className="flex cursor-pointer items-center justify-between border-b border-black/10 py-[13px] last:border-b-0"
              >
                <span className={`text-sm ${danger ? 'text-danger-text' : 'text-ink'}`}>
                  {label}
                </span>
                <span className="text-base text-ink-tertiary">›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="mypage" />

      {/* プロフィール編集ボトムシート */}
      {showProfileSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileSheet(false)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-[16px_16px_0_0] bg-white">
            <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-black/20" />
            <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-4 py-4">
              <span className="text-[15px] font-medium">あなたの情報・キャラ設定</span>
              <button
                onClick={() => setShowProfileSheet(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent hover:bg-surface"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="#1a1a18"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              {/* 年齢 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">年齢</label>
                <div className="flex items-center gap-[10px]">
                  <input
                    type="range"
                    min={18}
                    max={50}
                    value={editAge}
                    step={1}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[28px] text-right text-[13px] font-medium">{editAge}</span>
                  <span className="text-xs text-ink-secondary">歳</span>
                </div>
              </div>
              {/* 職業 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">職業</label>
                <select
                  value={editJob}
                  onChange={(e) => setEditJob(e.target.value as Job)}
                  className="w-full"
                >
                  {JOBS.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
              </div>
              {/* 趣味 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  趣味・好きなこと
                </label>
                <textarea
                  rows={2}
                  value={editHobbies}
                  onChange={(e) => setEditHobbies(e.target.value)}
                  placeholder="例：サッカー、映画、料理"
                />
              </div>
              {/* キャラ設定 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  キャラ設定（トーン）
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MY_TONES.map(({ key, label, sub }) => (
                    <button
                      key={key}
                      onClick={() => setEditTone(key)}
                      className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${editTone === key ? 'border-brand-border bg-brand-light' : 'border-black/10 hover:bg-surface'}`}
                    >
                      <p
                        className={`mb-0.5 text-xs font-medium ${editTone === key ? 'text-brand-dark' : 'text-ink'}`}
                      >
                        {label}
                      </p>
                      <span className="text-[11px] text-ink-secondary">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full cursor-pointer rounded-md border-none bg-brand py-3 text-sm font-medium text-brand-light transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
