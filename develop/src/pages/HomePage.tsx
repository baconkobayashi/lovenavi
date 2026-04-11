import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)
  const [replyCount, setReplyCount] = useState<number | null>(null)
  const [replyRate, setReplyRate] = useState<number | null>(null)

  useEffect(() => {
    async function loadStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: messages } = await supabase
        .from('messages')
        .select('feedback')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if (!messages) return

      setGeneratedCount(messages.length)

      const withFeedback = messages.filter((m) => m.feedback !== null)
      const replied = messages.filter((m) => m.feedback === 'yes')
      setReplyCount(replied.length)
      setReplyRate(
        withFeedback.length > 0 ? Math.round((replied.length / withFeedback.length) * 100) : null,
      )
    }
    loadStats()
  }, [])

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="frame">
          {/* ナビバー */}
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-[14px]">
            <span className="text-sm font-medium">lovenavigation</span>
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-light text-xs font-medium text-brand">
              田
            </div>
          </div>

          {/* グリーティング */}
          <div className="px-4 pb-2 pt-5">
            <p className="mb-0.5 text-xs text-ink-secondary">おかえりなさい</p>
            <p className="text-[18px] font-medium text-ink">今日はどうする？</p>
          </div>

          {/* 機能カード */}
          <div className="flex flex-col gap-3 p-4">
            {/* 初回アプローチ */}
            <button
              onClick={() => navigate('/first-approach')}
              className="w-full cursor-pointer rounded-lg border-2 border-brand-border bg-white p-5 text-left transition-colors hover:bg-surface"
            >
              <span className="mb-3 inline-block rounded-full bg-brand-light px-[10px] py-[3px] text-[11px] font-medium text-brand-dark">
                おすすめ
              </span>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-brand-light">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M10 2C5.6 2 2 5.1 2 9c0 2 .9 3.8 2.4 5.1L3.5 18l3.8-1.5C8.2 16.8 9.1 17 10 17c4.4 0 8-3.1 8-7s-3.6-8-8-8z" />
                  <path d="M7 9h6M7 12h4" />
                </svg>
              </div>
              <p className="mb-1.5 text-[15px] font-medium text-ink">初回アプローチを作る</p>
              <p className="mb-[14px] text-xs leading-[1.6] text-ink-secondary">
                相手のプロフィールを入力すると、好印象を与える最初のメッセージを自動生成します。
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['相手の年齢', '趣味・好み', '居住エリア'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-black/10 bg-surface px-2 py-[3px] text-[11px] text-ink-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-right text-xs font-medium text-brand">使ってみる →</div>
            </button>

            {/* 返信メッセージ */}
            <button
              onClick={() => navigate('/reply')}
              className="w-full cursor-pointer rounded-lg border border-black/10 bg-white p-5 text-left transition-colors hover:bg-surface"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-brand-light">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="2" y="4" width="16" height="12" rx="2" />
                  <path d="M2 7l8 5 8-5" />
                </svg>
              </div>
              <p className="mb-1.5 text-[15px] font-medium text-ink">返信メッセージを作る</p>
              <p className="mb-[14px] text-xs leading-[1.6] text-ink-secondary">
                相手の返信内容と目的を入れると、状況に合った返信を3パターン提案します。
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['相手の返信', 'やり取り回数', '目的'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-black/10 bg-surface px-2 py-[3px] text-[11px] text-ink-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-right text-xs font-medium text-ink-secondary">
                使ってみる →
              </div>
            </button>
          </div>

          {/* 履歴サマリー */}
          <div className="px-4 pb-2">
            <p className="mb-2 text-xs font-medium text-ink-secondary">あなたの履歴</p>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <div className="rounded-md bg-surface p-3">
              <p className="mb-1 text-[11px] text-ink-secondary">生成したメッセージ</p>
              <p className="text-xl font-medium text-ink">
                {generatedCount ?? '—'}
                <span className="text-[13px] font-normal text-ink-secondary"> 件</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-tertiary">今月</p>
            </div>
            <div className="rounded-md bg-surface p-3">
              <p className="mb-1 text-[11px] text-ink-secondary">返信きた報告</p>
              <p className="text-xl font-medium text-ink">
                {replyCount ?? '—'}
                <span className="text-[13px] font-normal text-ink-secondary"> 件</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-tertiary">
                {replyRate !== null ? `返信率 ${replyRate}%` : 'フィードバック未記録'}
              </p>
            </div>
          </div>

          <BottomNav active="home" />
        </div>
      </div>
    </div>
  )
}
