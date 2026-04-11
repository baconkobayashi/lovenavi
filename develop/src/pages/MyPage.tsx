import { useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'

type ResultTag = 'yes' | 'no' | 'pending'

interface HistoryItem {
  type: 'first' | 'reply'
  date: string
  text: string
  result: ResultTag | null
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
        .select('type, used_message, feedback, created_at')
        .eq('user_id', user.id)
        .not('used_message', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)
      if (recent) {
        setHistory(
          recent.map((m) => ({
            type: m.type === 'first_approach' ? 'first' : 'reply',
            date: formatRelativeDate(m.created_at),
            text: m.used_message,
            result: m.feedback as ResultTag | null,
          })),
        )
      }
    }
    load()
  }, [])

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="frame">
          {/* ナビ */}
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-[14px]">
            <span className="text-[15px] font-medium">マイページ</span>
            <button className="cursor-pointer rounded-md border border-brand-border bg-transparent px-[10px] py-1 text-xs text-brand">
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
              history.map(({ type, date, text, result }, i) => {
                const style = result ? RESULT_STYLES[result] : null
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 border-b border-black/10 py-[10px] last:border-b-0"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${type === 'first' ? 'bg-brand-light' : 'bg-[#E1F5EE]'}`}
                    >
                      {type === 'first' ? <IconFirst /> : <IconReply />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-[3px] flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-medium ${type === 'first' ? 'text-brand' : 'text-[#0F6E56]'}`}
                        >
                          {type === 'first' ? '初回アプローチ' : '返信'}
                        </span>
                        <span className="text-[11px] text-ink-tertiary">{date}</span>
                      </div>
                      <p className="mb-1 text-xs leading-[1.5] text-ink">{text}</p>
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
                )
              })
            )}
          </div>

          {/* アカウント設定 */}
          <div className="border-b border-black/10 p-4">
            <p className="mb-3 text-xs font-medium text-ink-secondary">アカウント設定</p>
            {[
              { label: '利用規約', danger: false },
              { label: 'プライバシーポリシー', danger: false },
              { label: 'お問い合わせ', danger: false },
              { label: 'ログアウト', danger: false },
              { label: '退会する', danger: true },
            ].map(({ label, danger }) => (
              <div
                key={label}
                className="flex cursor-pointer items-center justify-between border-b border-black/10 py-[13px] last:border-b-0"
              >
                <span className={`text-sm ${danger ? 'text-danger-text' : 'text-ink'}`}>
                  {label}
                </span>
                <span className="text-base text-ink-tertiary">›</span>
              </div>
            ))}
          </div>

          <BottomNav active="mypage" />
        </div>
      </div>
    </div>
  )
}
