import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { MY_TONES, type Tone } from '../lib/constants'

interface Pattern {
  id: number
  label: string
  tone: string
  message: string
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="4" y="4" width="8" height="8" rx="1.5" />
      <path d="M1 9V2a1 1 0 011-1h7" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 7l3 3 6-6" />
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

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const targetId: string | null = location.state?.targetId ?? null
  const initMessageId: string | null = location.state?.messageId ?? null
  const targetNickname: string = location.state?.targetNickname ?? ''
  const targetRelation = location.state?.targetRelation ?? null
  const targetAge = location.state?.targetAge ?? null
  const targetArea = location.state?.targetArea ?? null
  const targetHobbies = location.state?.targetHobbies ?? null
  const targetProfileText = location.state?.targetProfileText ?? null
  const myAge = location.state?.myAge ?? null
  const myJob = location.state?.myJob ?? null
  const myHobbies = location.state?.myHobbies ?? null
  const initMyTone: Tone | null = location.state?.myTone ?? null

  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)
  const [used, setUsed] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [feedback, setFeedback] = useState<'yes' | 'no' | 'pending' | null>(null)
  const [messageId, setMessageId] = useState<string | null>(initMessageId)
  const [showRegen, setShowRegen] = useState(false)
  const [regenTone, setRegenTone] = useState<Tone | null>(initMyTone)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    const statePatterns = location.state?.patterns
    if (statePatterns) {
      setPatterns(statePatterns)
      setLoading(false)
      return
    }
    // stateがない場合はトップへ（新スキーマではリロード不可）
    navigate('/first-approach', { replace: true })
  }, [])

  function handleCopy(id: number) {
    const pattern = patterns.find((p) => p.id === id)
    if (pattern) navigator.clipboard.writeText(pattern.message)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleUsed(id: number) {
    if (used === id) return
    setUsed(id)

    const usedPattern = ['a', 'b', 'c'][id - 1]
    const usedMessage = patterns.find((p) => p.id === id)?.message ?? null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      if (!messageId) {
        const { data: inserted } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            target_id: targetId,
            type: 'first_approach',
            pattern_a: patterns[0]?.message ?? null,
            pattern_b: patterns[1]?.message ?? null,
            pattern_c: patterns[2]?.message ?? null,
            tone_a: patterns[0]?.tone ?? null,
            tone_b: patterns[1]?.tone ?? null,
            tone_c: patterns[2]?.tone ?? null,
            used_pattern: usedPattern,
            used_message: usedMessage,
          })
          .select('id')
          .single()

        if (inserted) {
          setMessageId(inserted.id)
          if (targetId) {
            await supabase.from('conversation_turns').insert({
              user_id: user.id,
              target_id: targetId,
              message_id: inserted.id,
              sender: 'me',
              raw_text: usedMessage,
            })
          }
        }
      } else {
        await supabase
          .from('messages')
          .update({ used_pattern: usedPattern, used_message: usedMessage })
          .eq('id', messageId)

        if (targetId) {
          if (used === null) {
            await supabase.from('conversation_turns').insert({
              user_id: user.id,
              target_id: targetId,
              message_id: messageId,
              sender: 'me',
              raw_text: usedMessage,
            })
          } else {
            await supabase
              .from('conversation_turns')
              .update({ raw_text: usedMessage })
              .eq('message_id', messageId)
              .eq('sender', 'me')
          }
        }
      }
    }

    setTimeout(() => setShowModal(true), 400)
  }

  async function handleRegen() {
    setRegenerating(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setRegenerating(false)
      return
    }

    const { data, error } = await supabase.functions.invoke('generate-message', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        targetRelation,
        targetAge,
        targetArea,
        targetHobbies,
        targetProfileText,
        myAge,
        myJob,
        myHobbies,
        tone: regenTone,
      },
    })

    if (!error && data?.patterns) {
      const newPatterns = (data.patterns as { tone: string; message: string }[]).map((p, i) => ({
        id: i + 1,
        label: `パターン ${'ABC'[i]}`,
        tone: p.tone,
        message: p.message,
      }))
      setPatterns(newPatterns)
      setUsed(null)

      if (messageId) {
        await supabase
          .from('messages')
          .update({
            pattern_a: newPatterns[0]?.message ?? null,
            pattern_b: newPatterns[1]?.message ?? null,
            pattern_c: newPatterns[2]?.message ?? null,
            tone_a: newPatterns[0]?.tone ?? null,
            tone_b: newPatterns[1]?.tone ?? null,
            tone_c: newPatterns[2]?.tone ?? null,
            used_pattern: null,
            used_message: null,
          })
          .eq('id', messageId)
      } else {
        const { data: inserted } = await supabase
          .from('messages')
          .insert({
            user_id: session.user.id,
            target_id: targetId,
            type: 'first_approach',
            pattern_a: newPatterns[0]?.message ?? null,
            pattern_b: newPatterns[1]?.message ?? null,
            pattern_c: newPatterns[2]?.message ?? null,
            tone_a: newPatterns[0]?.tone ?? null,
            tone_b: newPatterns[1]?.tone ?? null,
            tone_c: newPatterns[2]?.tone ?? null,
          })
          .select('id')
          .single()
        if (inserted) setMessageId(inserted.id)
      }
    }
    setRegenerating(false)
    setShowRegen(false)
  }

  async function handleFeedback(type: 'yes' | 'no' | 'pending') {
    setFeedback(type)
    if (messageId) {
      await supabase.from('messages').update({ feedback: type }).eq('id', messageId)
    }
    setTimeout(() => setShowModal(false), 800)
  }

  return (
    <>
      <div className="flex justify-center bg-page px-4 py-8 pb-6">
        <div className="w-full max-w-[400px]">
          <div className="frame mb-4">
            <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
              <button
                onClick={() => navigate(-1)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent"
              >
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
              </button>
              <span className="flex-1 text-[15px] font-medium">生成結果</span>
              <button
                onClick={() => navigate('/home')}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary"
              >
                <HomeIcon />
                ホーム
              </button>
            </div>

            <div className="p-4">
              {loading && (
                <div className="flex flex-col items-center py-12">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <p className="text-sm text-ink-secondary">メッセージを生成中...</p>
                </div>
              )}

              {!loading && (
                <>
                  {/* コンテキスト */}
                  <div className="mb-4 rounded-md bg-surface p-[10px_12px]">
                    {targetNickname && (
                      <p className="mb-2 text-[13px] font-medium text-ink">{targetNickname}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        targetAge ? `${targetAge}歳` : null,
                        targetArea || null,
                        targetHobbies || null,
                      ]
                        .filter(Boolean)
                        .map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-black/10 bg-white px-2 py-[3px] text-[11px] text-ink-secondary"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  </div>

                  <p className="mb-[10px] text-xs font-medium text-ink-secondary">
                    3つの候補から選んでください
                  </p>

                  {patterns.map(({ id, label, tone, message }) => (
                    <div
                      key={id}
                      className="mb-[10px] rounded-lg border border-black/10 bg-white p-[14px]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-surface px-[10px] py-[3px] text-[11px] font-medium text-ink-secondary">
                          {label}
                        </span>
                        <span className="rounded-full border border-black/10 px-2 py-[2px] text-[10px] text-ink-tertiary">
                          {tone}
                        </span>
                      </div>
                      <p className="mb-3 text-[13px] leading-[1.7] text-ink">{message}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(id)
                          }}
                          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border py-2 text-xs transition-all ${copied === id ? 'border-success-border bg-success-bg text-success-text' : 'border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                        >
                          {copied === id ? <CheckIcon /> : <CopyIcon />}
                          {copied === id ? 'コピー済み' : 'コピー'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUsed(id)
                          }}
                          className={`flex-1 cursor-pointer rounded-md border-none py-2 text-xs font-medium transition-all ${used === id ? 'border border-success-border bg-success-bg text-success-text' : 'bg-brand text-brand-light hover:bg-brand-dark'}`}
                        >
                          {used === id ? '使った' : 'これを使う'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 再生成エリア */}
              {!loading && patterns.length > 0 && (
                <>
                  <button
                    onClick={() => setShowRegen(!showRegen)}
                    className="mt-1 w-full cursor-pointer rounded-md border border-black/20 bg-transparent py-[11px] text-[13px] text-ink-secondary hover:bg-surface"
                  >
                    条件を変えてもう一度生成する ↓
                  </button>

                  {showRegen && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-black/10">
                      <div className="border-b border-black/10 bg-surface px-[14px] py-3 text-xs font-medium text-ink-secondary">
                        条件を編集して再生成
                      </div>
                      <div className="flex flex-col gap-3 p-[14px]">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-ink">
                            キャラ設定
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {MY_TONES.map(({ key, label, sub }) => (
                              <button
                                key={key}
                                onClick={() => setRegenTone(key)}
                                className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${regenTone === key ? 'border-brand-border bg-brand-light' : 'border-black/10 hover:bg-surface'}`}
                              >
                                <p
                                  className={`mb-0.5 text-xs font-medium ${regenTone === key ? 'text-brand-dark' : 'text-ink'}`}
                                >
                                  {label}
                                </p>
                                <span className="text-[11px] text-ink-secondary">{sub}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={handleRegen}
                          disabled={regenerating}
                          className="w-full cursor-pointer rounded-md border-none bg-brand py-[11px] text-[13px] font-medium text-brand-light disabled:opacity-50"
                        >
                          {regenerating ? '生成中...' : 'この条件で再生成する'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {showModal && (
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
                      active: 'bg-[#EAF3DE] border-[#B6D98A] text-[#3B6D11]',
                    },
                    {
                      key: 'pending',
                      label: 'まだ待ち中',
                      active: 'bg-[#FAEEDA] border-[#F0C87A] text-[#633806]',
                    },
                    {
                      key: 'no',
                      label: '既読スルー',
                      active: 'bg-[#FCEBEB] border-[#F0A0A0] text-[#A32D2D]',
                    },
                  ] as const
                ).map(({ key, label, active }) => (
                  <button
                    key={key}
                    onClick={() => handleFeedback(key)}
                    className={`flex-1 cursor-pointer rounded-md border px-1.5 py-3 text-center text-[13px] font-medium transition-all ${feedback === key ? active : 'border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-full cursor-pointer rounded-md border-none bg-transparent py-[10px] text-xs text-ink-tertiary hover:text-ink-secondary"
              >
                あとで回答する
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav active="home" />
    </>
  )
}
