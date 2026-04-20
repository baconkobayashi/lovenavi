import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'

type FeedbackType = 'yes' | 'no' | 'pending' | null
type FilterType = 'all' | 'first' | 'reply' | 'unanswered'

interface MessageRow {
  id: string
  type: 'first_approach' | 'reply'
  used_message: string | null
  feedback: FeedbackType
  created_at: string
  target_id: string | null
  targets: { nickname: string } | null
}

function getDateLabel(dateStr: string): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(
    new Date(dateStr).getFullYear(),
    new Date(dateStr).getMonth(),
    new Date(dateStr).getDate(),
  )
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  return `${diffDays}日前`
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const IconFirst = () => (
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
const IconReply = () => (
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

export default function HistoryPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('messages')
        .select('id, type, used_message, feedback, created_at, target_id, targets(nickname)')
        .eq('user_id', user.id)
        .not('used_message', 'is', null)
        .order('created_at', { ascending: false })
      if (data)
        setMessages(
          data.map((m) => ({
            ...m,
            targets: Array.isArray(m.targets) ? (m.targets[0] ?? null) : m.targets,
          })) as MessageRow[],
        )
    }
    load()
  }, [])

  async function handleFeedback(id: string, type: FeedbackType) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, feedback: type } : m)))
    await supabase.from('messages').update({ feedback: type }).eq('id', id)
    setEditingId(null)
  }

  const filtered = messages.filter((m) => {
    if (filter === 'first') return m.type === 'first_approach'
    if (filter === 'reply') return m.type === 'reply'
    if (filter === 'unanswered') return m.feedback === null
    return true
  })

  const groups: { label: string; items: MessageRow[] }[] = []
  for (const msg of filtered) {
    const label = getDateLabel(msg.created_at)
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(msg)
    else groups.push({ label, items: [msg] })
  }

  const chips: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'first', label: '初回アプローチ' },
    { key: 'reply', label: 'メール返信' },
    { key: 'unanswered', label: '未回答のみ' },
  ]

  return (
    <>
      <div className="flex justify-center bg-page px-4 py-8 pb-6">
        <div className="w-full max-w-[400px]">
          <div className="frame">
            {/* ナビ */}
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-[14px]">
              <span className="text-[15px] font-medium">履歴</span>
              <button
                onClick={() => navigate('/home')}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary hover:bg-surface"
              >
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
                ホーム
              </button>
            </div>

            {/* フィルターチップ */}
            <div className="flex gap-2 overflow-x-auto border-b border-black/10 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {chips.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 py-[5px] text-xs transition-all ${filter === key ? 'border border-[#AFA9EC] bg-[#EEEDFE] font-medium text-[#3C3489]' : 'border border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 凡例 */}
            <div className="flex gap-3.5 border-b border-black/10 bg-surface px-4 py-[9px]">
              <div className="flex items-center gap-1.5">
                <div className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#639922]" />
                <span className="text-[11px] text-ink-secondary">フィードバック回答済み</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#EF9F27]" />
                <span className="text-[11px] text-ink-secondary">未回答</span>
              </div>
            </div>

            {/* リスト */}
            <div className="px-4">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-ink-tertiary">履歴がありません</p>
              )}
              {groups.map(({ label, items }) => (
                <div key={label}>
                  <p className="pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-tertiary">
                    {label}
                  </p>
                  {items.map((msg) => {
                    const isFirst = msg.type === 'first_approach'
                    const answered = msg.feedback !== null
                    return (
                      <div
                        key={msg.id}
                        onClick={() =>
                          msg.target_id &&
                          navigate('/reply', { state: { targetId: msg.target_id } })
                        }
                        className={`flex gap-3 border-b border-black/10 py-3 last:border-none ${msg.target_id ? 'cursor-pointer transition-colors hover:bg-surface' : ''}`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isFirst ? 'bg-[#EEEDFE]' : 'bg-[#E1F5EE]'}`}
                        >
                          {isFirst ? <IconFirst /> : <IconReply />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-[3px] flex items-center">
                            <span
                              className={`text-[11px] font-medium ${isFirst ? 'text-[#534AB7]' : 'text-[#0F6E56]'}`}
                            >
                              {isFirst ? '初回アプローチ' : 'メール返信'}
                            </span>
                            {msg.targets?.nickname && (
                              <>
                                <span className="mx-1 text-[10px] text-ink-tertiary">·</span>
                                <span className="text-[11px] font-medium text-ink-secondary">
                                  {msg.targets.nickname}
                                </span>
                              </>
                            )}
                            <span className="ml-auto text-[11px] text-ink-tertiary">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          <p className="mb-1.5 max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink">
                            {msg.used_message}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {msg.feedback === 'yes' && (
                              <span className="rounded-full bg-[#EAF3DE] px-2 py-[2px] text-[10px] font-medium text-[#3B6D11]">
                                返信きた
                              </span>
                            )}
                            {msg.feedback === 'no' && (
                              <span className="rounded-full bg-[#FCEBEB] px-2 py-[2px] text-[10px] font-medium text-[#A32D2D]">
                                既読スルー
                              </span>
                            )}
                            {msg.feedback === 'pending' && (
                              <span className="rounded-full bg-[#FAEEDA] px-2 py-[2px] text-[10px] font-medium text-[#633806]">
                                まだ待ち中
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${answered ? 'bg-[#639922]' : 'bg-[#EF9F27]'}`}
                              />
                              <span
                                className={`text-[10px] ${answered ? 'text-[#3B6D11]' : 'text-[#633806]'}`}
                              >
                                {answered ? '回答済み' : '未回答'}
                              </span>
                            </div>
                            {!answered && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingId(msg.id)
                                }}
                                className="ml-auto cursor-pointer rounded-full border border-[#AFA9EC] bg-transparent px-2 py-[2px] text-[10px] text-[#534AB7] transition-colors hover:bg-[#EEEDFE]"
                              >
                                結果を入力する
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="history" />

      {/* フィードバックモーダル */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-[400px] rounded-[16px_16px_0_0] bg-white px-4 pb-8 pt-5">
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/20" />
            <p className="mb-1 text-center text-[15px] font-medium">送って、どうでしたか？</p>
            <p className="mb-4 text-center text-xs text-ink-secondary">
              結果を教えてもらえるとAIが賢くなります
            </p>
            <div className="mb-[10px] flex gap-2">
              {(
                [
                  {
                    key: 'yes',
                    label: '返信きた',
                    cls: 'bg-success-bg border-success-border text-success-text',
                  },
                  {
                    key: 'pending',
                    label: 'まだ待ち中',
                    cls: 'bg-warn-bg border-warn-border text-warn-text',
                  },
                  {
                    key: 'no',
                    label: '既読スルー',
                    cls: 'bg-danger-bg border-danger-border text-danger-text',
                  },
                ] as const
              ).map(({ key, label, cls }) => (
                <button
                  key={key}
                  onClick={() => handleFeedback(editingId, key)}
                  className={`flex-1 cursor-pointer rounded-md border border-black/20 bg-transparent px-1.5 py-3 text-center text-[13px] font-medium text-ink transition-all hover:${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditingId(null)}
              className="w-full cursor-pointer rounded-md border-none bg-transparent py-[10px] text-xs text-ink-tertiary hover:text-ink-secondary"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  )
}
