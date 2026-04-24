import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { AREAS, RELATIONS, TARGET_TONES, type TargetTone } from '../lib/constants'

type Count = '初回' | '2〜5回' | '6〜10回' | '11回以上'
type Purpose = '会話を続ける' | 'デートに誘う' | 'LINE交換' | '関係を温める'
type RelationLabel = 'マッチング直後' | '数回やり取り済み' | '会ったことある' | '付き合い中'

const DRAFT_KEY = 'reply-draft'

const COUNTS: Count[] = ['初回', '2〜5回', '6〜10回', '11回以上']
const PURPOSES: { label: Purpose; sub: string }[] = [
  { label: '会話を続ける', sub: '仲良くなりたい' },
  { label: 'デートに誘う', sub: '会う約束をしたい' },
  { label: 'LINE交換', sub: 'アプリ外に移行したい' },
  { label: '関係を温める', sub: 'もっと距離を縮めたい' },
]
const AVATAR_COLORS = [
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#EAF3DE', text: '#3B6D11' },
]

interface Target {
  id: string
  nickname: string
  relation: string | null
  age: number | null
  area: string | null
  hobbies: string | null
  profile_text: string | null
  updated_at: string
}

interface ConversationItem {
  id?: string
  sender: 'me' | 'them'
  text: string
  createdAt: string
}

function getRelationLabel(key: string | null): string {
  return RELATIONS.find((r) => r.key === key)?.label ?? ''
}

function formatTargetDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
  const t = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  if (diff === 0) return `今日 ${t}`
  if (diff === 1) return `昨日 ${t}`
  return `${diff}日前 ${t}`
}

function getHobbiesTags(hobbies: string | null): string[] {
  if (!hobbies) return []
  return hobbies
    .split(/[,、]/)
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 3)
}

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
function Badge({ required }: { required: boolean }) {
  if (required)
    return (
      <span className="rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger-text">
        必須
      </span>
    )
  return <span className="text-[10px] text-ink-tertiary">任意</span>
}

export default function ReplyInputPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [targets, setTargets] = useState<Target[]>([])
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [conversation, setConversation] = useState<ConversationItem[]>([])
  const [latestMessage, setLatestMessage] = useState('')
  const [count, setCount] = useState<Count | null>(null)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [tone, setTone] = useState<TargetTone | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const [showSheet, setShowSheet] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // モーダル内フォーム
  const [modalNickname, setModalNickname] = useState('')
  const [modalRelation, setModalRelation] = useState<RelationLabel>('マッチング直後')
  const [modalAge, setModalAge] = useState(25)
  const [modalArea, setModalArea] = useState('東京')
  const [modalHobbies, setModalHobbies] = useState('')
  const [modalProfileText, setModalProfileText] = useState('')

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    async function loadTargets() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('targets')
        .select('id, nickname, relation, age, area, hobbies, profile_text, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (data) {
        const loaded = data as Target[]
        setTargets(loaded)
        const preselectedId = location.state?.targetId
        if (preselectedId) {
          sessionStorage.removeItem(DRAFT_KEY)
          const found = loaded.find((t) => t.id === preselectedId)
          if (found) setSelectedTarget(found)
        } else {
          const saved = sessionStorage.getItem(DRAFT_KEY)
          if (saved) {
            const d = JSON.parse(saved)
            if (d.count) setCount(d.count)
            if (d.purpose) setPurpose(d.purpose)
            if (d.tone) setTone(d.tone)
            if (d.targetId) {
              const found = loaded.find((t) => t.id === d.targetId)
              if (found) setSelectedTarget(found)
            }
          }
        }
      }
    }
    loadTargets()
  }, [])

  useEffect(() => {
    if (!selectedTarget?.id) {
      setConversation([])
      return
    }
    async function loadConversation() {
      const { data } = await supabase
        .from('conversation_turns')
        .select('id, sender, raw_text, created_at')
        .eq('target_id', selectedTarget!.id)
        .order('created_at', { ascending: true })
      if (data) {
        setConversation(
          data.map((t) => ({
            id: t.id,
            sender: t.sender === 'target' ? 'them' : 'me',
            text: t.raw_text ?? '',
            createdAt: t.created_at,
          })),
        )
      }
    }
    loadConversation()
  }, [selectedTarget?.id])

  function selectPartner(target: Target) {
    setSelectedTarget(target)
    setTimeout(() => setShowSheet(false), 180)
  }

  function openEditModal(target: Target) {
    setModalNickname(target.nickname)
    setModalRelation((getRelationLabel(target.relation) as RelationLabel) || 'マッチング直後')
    setModalAge(target.age ?? 25)
    setModalArea(target.area ?? '東京')
    setModalHobbies(target.hobbies ?? '')
    setModalProfileText(target.profile_text ?? '')
    setShowModal(true)
  }

  async function saveProfile() {
    if (!selectedTarget || !modalNickname.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const relationKey = RELATIONS.find((r) => r.label === modalRelation)?.key ?? null
    await supabase
      .from('targets')
      .update({
        nickname: modalNickname,
        relation: relationKey,
        age: modalAge,
        area: modalArea,
        hobbies: modalHobbies,
        profile_text: modalProfileText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTarget.id)

    const updated: Target = {
      ...selectedTarget,
      nickname: modalNickname,
      relation: relationKey,
      age: modalAge,
      area: modalArea,
      hobbies: modalHobbies,
      profile_text: modalProfileText,
    }
    setSelectedTarget(updated)
    setTargets((prev) => prev.map((t) => (t.id === selectedTarget.id ? updated : t)))
    setShowModal(false)
  }

  async function saveLatestMessage() {
    if (!latestMessage.trim() || !selectedTarget) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: turn } = await supabase
      .from('conversation_turns')
      .insert({
        user_id: user.id,
        target_id: selectedTarget.id,
        sender: 'target',
        raw_text: latestMessage,
      })
      .select('id, created_at')
      .single()
    if (turn) {
      setConversation((prev) => [
        ...prev,
        { id: turn.id, sender: 'them', text: latestMessage, createdAt: turn.created_at },
      ])
    }
    setLatestMessage('')
  }

  async function deleteTurn(id: string) {
    await supabase.from('conversation_turns').delete().eq('id', id)
    setConversation((prev) => prev.filter((item) => item.id !== id))
  }

  async function saveTurnEdit(id: string) {
    if (!editingText.trim()) return
    await supabase.from('conversation_turns').update({ raw_text: editingText }).eq('id', id)
    setConversation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: editingText } : item)),
    )
    setEditingId(null)
    setEditingText('')
  }

  async function handleGenerate() {
    if (!selectedTarget) return
    setGenerating(true)
    setGenError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setGenerating(false)
      return
    }

    const latestThemMessage = [...conversation].reverse().find((c) => c.sender === 'them')

    const { data, error: fnError } = await supabase.functions.invoke('generate-reply', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        conversationHistory: conversation.map((c) => ({
          sender: c.sender === 'them' ? 'target' : 'me',
          text: c.text,
        })),
        latestMessage: latestThemMessage?.text ?? '',
        count,
        purpose,
        tone,
        targetRelation: selectedTarget.relation,
        targetAge: selectedTarget.age,
        targetArea: selectedTarget.area,
        targetHobbies: selectedTarget.hobbies,
      },
    })

    if (fnError) {
      setGenError('生成に失敗しました。もう一度お試しください。')
      setGenerating(false)
      return
    }

    const patterns = (data.patterns as { tone: string; message: string }[]).map((p, i) => ({
      id: i + 1,
      label: `パターン ${'ABC'[i]}`,
      tone: p.tone,
      message: p.message,
    }))

    let messageId: string | null = null
    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        user_id: session.user.id,
        target_id: selectedTarget.id,
        type: 'reply',
        pattern_a: patterns[0]?.message ?? null,
        pattern_b: patterns[1]?.message ?? null,
        pattern_c: patterns[2]?.message ?? null,
        tone_a: patterns[0]?.tone ?? null,
        tone_b: patterns[1]?.tone ?? null,
        tone_c: patterns[2]?.tone ?? null,
      })
      .select('id')
      .single()
    if (inserted) messageId = inserted.id

    setGenerating(false)
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ targetId: selectedTarget.id, count, purpose, tone }),
    )
    navigate('/reply-result', {
      state: {
        patterns,
        messageId,
        latestMessage: latestThemMessage?.text ?? '',
        count,
        purpose,
        tone,
        conversationHistory: conversation.map((c) => ({
          sender: c.sender === 'them' ? 'target' : 'me',
          text: c.text,
        })),
        targetRelation: selectedTarget.relation,
        targetAge: selectedTarget.age,
        targetArea: selectedTarget.area,
        targetHobbies: selectedTarget.hobbies,
        targetId: selectedTarget.id,
      },
    })
  }

  // 選択済み表示用のタグ
  const profileTags = selectedTarget
    ? [selectedTarget.area, ...getHobbiesTags(selectedTarget.hobbies)].filter(Boolean)
    : []

  return (
    <>
      <div className="flex justify-center bg-page px-4 py-8 pb-6">
        <div className="w-full max-w-[400px]">
          <div className="frame mb-4">
            {/* ナビ */}
            <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
              <button
                onClick={() => {
                  sessionStorage.removeItem(DRAFT_KEY)
                  navigate('/home')
                }}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent hover:bg-surface"
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
              <span className="flex-1 text-[15px] font-medium">返信メッセージを作る</span>
              <button
                onClick={() => {
                  sessionStorage.removeItem(DRAFT_KEY)
                  navigate('/home')
                }}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary hover:bg-surface"
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

            <div className="p-5">
              <div className="mb-4 flex items-start gap-2 rounded-md bg-brand-light p-[10px_12px]">
                <InfoIcon />
                <span className="text-[11px] leading-[1.5] text-brand-dark">
                  相手の情報を追加するとより的確な返信が生成されます。
                </span>
              </div>

              {/* 相手のプロフィール */}
              <div className="mb-[18px]">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                  相手のプロフィール <Badge required={false} />
                </p>

                {!selectedTarget ? (
                  <button
                    onClick={() => setShowSheet(true)}
                    className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-md border border-black/20 bg-surface p-[12px_14px] transition-colors hover:bg-[#e8e6df]"
                  >
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          stroke="#534AB7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <circle cx="9" cy="6" r="3" />
                          <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-ink">相手の情報を入力する</div>
                        <div className="mt-0.5 text-[11px] text-ink-tertiary">
                          関係値・年齢・趣味・エリアなど
                        </div>
                      </div>
                    </div>
                    <span className="text-lg text-ink-tertiary">›</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSheet(true)}
                    className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-md border border-[#AFA9EC] bg-[#EEEDFE] p-[12px_14px] transition-colors hover:bg-[#E4E2FC]"
                  >
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CECBF6]">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          stroke="#534AB7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <circle cx="9" cy="6" r="3" />
                          <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#3C3489]">
                          {selectedTarget.nickname}
                          {getRelationLabel(selectedTarget.relation) &&
                            ` · ${getRelationLabel(selectedTarget.relation)}`}
                          {selectedTarget.age && ` · ${selectedTarget.age}歳`}
                        </div>
                        {profileTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {profileTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#CECBF6] px-[7px] py-[2px] text-[10px] text-[#3C3489]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-brand">変更 ›</span>
                  </button>
                )}
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  {!selectedTarget
                    ? 'タップして相手を選択できます'
                    : 'タップして相手を切り替え・編集できます'}
                </p>
              </div>

              {/* 相手の最新メッセージ */}
              <div className="mb-[18px]">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                  相手の最新メッセージ <Badge required={false} />
                </p>
                <textarea
                  rows={3}
                  value={latestMessage}
                  onChange={(e) => setLatestMessage(e.target.value)}
                  placeholder="例：そうなんだ〜、週末何してるの？"
                  disabled={!selectedTarget}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-ink-tertiary">
                    相手のメッセージをそのままコピペしてください
                  </p>
                  <button
                    onClick={saveLatestMessage}
                    disabled={!latestMessage.trim() || !selectedTarget}
                    className="cursor-pointer rounded-md border border-black/20 bg-transparent px-3 py-1.5 text-xs text-ink-secondary transition-all hover:bg-surface disabled:opacity-40"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* やり取りの流れ */}
              {conversation.length > 0 && (
                <div className="mb-[18px]">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                    これまでのやり取り <Badge required={false} />
                  </p>
                  <div className="flex flex-col gap-2">
                    {conversation.map((item, i) =>
                      item.sender === 'me' ? (
                        <div key={i} className="flex items-end gap-2">
                          <div className="max-w-[75%] rounded-[4px_12px_12px_12px] bg-surface px-3 py-2 text-xs leading-[1.6] text-ink">
                            {item.text}
                          </div>
                          <span className="whitespace-nowrap text-[10px] text-ink-tertiary">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      ) : (
                        <div key={i} className="flex flex-row-reverse items-end gap-2">
                          {editingId === item.id ? (
                            <div className="flex w-[75%] flex-col gap-1">
                              <textarea
                                rows={2}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full rounded-[12px_4px_12px_12px] border border-brand-border bg-brand-light px-3 py-2 text-xs leading-[1.6] text-ink outline-none"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditingText('')
                                  }}
                                  className="cursor-pointer rounded border border-black/10 bg-transparent px-2 py-0.5 text-[10px] text-ink-tertiary hover:bg-surface"
                                >
                                  キャンセル
                                </button>
                                <button
                                  onClick={() => saveTurnEdit(item.id!)}
                                  className="cursor-pointer rounded border-none bg-brand px-2 py-0.5 text-[10px] text-brand-light"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-[75%] rounded-[12px_4px_12px_12px] bg-brand px-3 py-2 text-xs leading-[1.6] text-brand-light">
                              {item.text}
                            </div>
                          )}
                          <div className="flex flex-col items-end gap-1">
                            <span className="whitespace-nowrap text-[10px] text-ink-tertiary">
                              {formatDate(item.createdAt)}
                            </span>
                            {item.id && editingId !== item.id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingId(item.id!)
                                    setEditingText(item.text)
                                  }}
                                  className="cursor-pointer rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-[10px] text-ink-tertiary hover:border-brand-border hover:text-brand"
                                >
                                  編集
                                </button>
                                <button
                                  onClick={() => deleteTurn(item.id!)}
                                  className="cursor-pointer rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-[10px] text-ink-tertiary hover:border-danger-border hover:text-danger-text"
                                >
                                  削除
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-ink-tertiary">
                    入れるほど会話の流れを読んだ返信になります
                  </p>
                </div>
              )}

              {/* やり取り回数 */}
              <div className="mb-[18px]">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                  やり取りの回数 <Badge required />
                </p>
                <div className="flex flex-wrap gap-2">
                  {COUNTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCount(c)}
                      className={`cursor-pointer rounded-full border px-[14px] py-1.5 text-xs transition-all ${count === c ? 'border-brand-border bg-brand-light font-medium text-brand-dark' : 'border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 目的 */}
              <div className="mb-[18px]">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                  今回の目的 <Badge required />
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PURPOSES.map(({ label, sub }) => (
                    <button
                      key={label}
                      onClick={() => setPurpose(label)}
                      className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all hover:bg-surface ${purpose === label ? 'border-brand-border bg-brand-light' : 'border-black/10'}`}
                    >
                      <p
                        className={`mb-0.5 text-xs font-medium ${purpose === label ? 'text-brand-dark' : 'text-ink'}`}
                      >
                        {label}
                      </p>
                      <span className="text-[11px] text-ink-secondary">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 相手のトーン */}
              <div className="mb-[18px]">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                  相手のトーン <Badge required={false} />
                </p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`cursor-pointer rounded-full border px-[14px] py-1.5 text-xs transition-all ${tone === t ? 'border-brand-border bg-brand-light font-medium text-brand-dark' : 'border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {genError && <p className="mb-3 text-center text-xs text-danger-text">{genError}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedTarget || count === null || purpose === null}
                className="w-full cursor-pointer rounded-md border-none bg-brand py-[13px] text-sm font-medium text-brand-light transition-colors hover:bg-brand-dark disabled:opacity-40"
              >
                {generating ? '生成中...' : '返信を生成する'}
              </button>
            </div>
          </div>
        </div>

        {/* 相手選択ボトムシート */}
        {showSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSheet(false)
            }}
          >
            <div className="w-full max-w-[400px] rounded-[16px_16px_0_0] bg-white pb-6">
              <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-black/20" />
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
                <span className="text-[15px] font-medium">相手を選ぶ</span>
                <button
                  onClick={() => setShowSheet(false)}
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

              {targets.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="mb-2 text-xs text-ink-secondary">まだ相手が登録されていません</p>
                  <button
                    onClick={() => {
                      setShowSheet(false)
                      navigate('/first-approach')
                    }}
                    className="cursor-pointer text-xs font-medium text-brand hover:underline"
                  >
                    初回アプローチから始める →
                  </button>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto px-4 [scrollbar-width:thin]">
                  {targets.map((target, i) => {
                    const colors = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    const isSelected = selectedTarget?.id === target.id
                    const tags = [
                      getRelationLabel(target.relation),
                      target.age ? `${target.age}歳` : null,
                      target.area,
                      getHobbiesTags(target.hobbies).join('・') || null,
                    ].filter(Boolean) as string[]

                    return (
                      <div
                        key={target.id}
                        onClick={() => selectPartner(target)}
                        className="flex cursor-pointer items-center gap-3 border-b border-black/10 py-[13px] last:border-none hover:opacity-75"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {target.nickname[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-baseline gap-2">
                            <span className="text-[14px] font-medium text-ink">
                              {target.nickname}
                            </span>
                            <span className="text-[11px] text-ink-tertiary">
                              {formatTargetDate(target.updated_at)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-black/10 bg-surface px-[7px] py-[2px] text-[10px] text-ink-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowSheet(false)
                                openEditModal(target)
                              }}
                              className="cursor-pointer rounded-full border border-[#AFA9EC] bg-transparent px-[9px] py-[3px] text-[11px] text-brand hover:bg-brand-light"
                            >
                              編集
                            </button>
                          )}
                          {isSelected ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              >
                                <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-[1.5px] border-black/25" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {targets.length > 4 && (
                <div className="flex items-center justify-center gap-1 py-2 text-[11px] text-ink-tertiary">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="#888780"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M7 2v10M3 8l4 4 4-4" />
                  </svg>
                  スクロールして他の相手を表示
                </div>
              )}
            </div>
          </div>
        )}

        {/* プロフィール編集モーダル */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-[16px_16px_0_0] bg-white">
              <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-black/20" />
              <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-4 py-4">
                <span className="text-[15px] font-medium">相手のプロフィール</span>
                <button
                  onClick={() => setShowModal(false)}
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
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">
                    ニックネーム <span className="text-[10px] text-danger-text">必須</span>
                  </label>
                  <input
                    type="text"
                    value={modalNickname}
                    onChange={(e) => setModalNickname(e.target.value)}
                    placeholder="例：カフェさん"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">関係値</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RELATIONS.map(({ label, sub }) => (
                      <button
                        key={label}
                        onClick={() => setModalRelation(label as RelationLabel)}
                        className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${modalRelation === label ? 'border-brand-border bg-brand-light' : 'border-black/10 hover:bg-surface'}`}
                      >
                        <p
                          className={`mb-0.5 text-xs font-medium ${modalRelation === label ? 'text-brand-dark' : 'text-ink'}`}
                        >
                          {label}
                        </p>
                        <span className="text-[11px] text-ink-secondary">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">年齢</label>
                  <div className="flex items-center gap-[10px]">
                    <input
                      type="range"
                      min={18}
                      max={45}
                      value={modalAge}
                      step={1}
                      onChange={(e) => setModalAge(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="min-w-[28px] text-right text-[13px] font-medium">
                      {modalAge}
                    </span>
                    <span className="text-xs text-ink-secondary">歳</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">居住エリア</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AREAS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setModalArea(a)}
                        className={`cursor-pointer rounded-full border px-3 py-[5px] text-xs transition-all ${modalArea === a ? 'border-brand-border bg-brand-light font-medium text-brand-dark' : 'border-black/20 bg-transparent text-ink hover:bg-surface'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">
                    趣味・好きなこと
                  </label>
                  <textarea
                    rows={2}
                    value={modalHobbies}
                    onChange={(e) => setModalHobbies(e.target.value)}
                    placeholder="例：カフェ巡り、映画鑑賞"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">
                    プロフィール文（あれば）
                  </label>
                  <textarea
                    rows={2}
                    value={modalProfileText}
                    onChange={(e) => setModalProfileText(e.target.value)}
                    placeholder="プロフィールをそのままコピペでもOK"
                  />
                </div>
                <button
                  onClick={saveProfile}
                  disabled={!modalNickname.trim()}
                  className="w-full cursor-pointer rounded-md border-none bg-brand py-3 text-sm font-medium text-brand-light transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  保存して戻る
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav active="home" />
    </>
  )
}
