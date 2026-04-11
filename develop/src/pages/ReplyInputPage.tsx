import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Count = '初回' | '2〜5回' | '6〜10回' | '11回以上'
type Purpose = '会話を続ける' | 'デートに誘う' | 'LINE交換' | '関係を温める'
type Tone = 'テンション高め' | '普通' | '素っ気ない' | 'わからない'
type Relation = 'マッチング直後' | '数回やり取り済み' | '会ったことある' | '付き合い中'

const COUNTS: Count[] = ['初回', '2〜5回', '6〜10回', '11回以上']
const PURPOSES: { label: Purpose; sub: string }[] = [
  { label: '会話を続ける', sub: '仲良くなりたい' },
  { label: 'デートに誘う', sub: '会う約束をしたい' },
  { label: 'LINE交換', sub: 'アプリ外に移行したい' },
  { label: '関係を温める', sub: 'もっと距離を縮めたい' },
]
const TONES: Tone[] = ['テンション高め', '普通', '素っ気ない', 'わからない']
const AREAS = ['東京', '神奈川', '大阪', '名古屋', 'その他']
const RELATIONS: { label: Relation; sub: string }[] = [
  { label: 'マッチング直後', sub: 'まだ会話していない' },
  { label: '数回やり取り済み', sub: '少し話したことある' },
  { label: '会ったことある', sub: 'オフラインで会った' },
  { label: '付き合い中', sub: '交際中のやり取り' },
]

const RELATION_MAP: Record<string, Relation> = {
  matching: 'マッチング直後',
  chatted: '数回やり取り済み',
  met: '会ったことある',
  dating: '付き合い中',
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
  const [latestMessage, setLatestMessage] = useState('')
  const [count, setCount] = useState<Count | null>(null)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [tone, setTone] = useState<Tone | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [profileFilled, setProfileFilled] = useState(false)
  const [relation, setRelation] = useState<Relation>('マッチング直後')
  const [modalAge, setModalAge] = useState(25)
  const [area, setArea] = useState('東京')
  const [hobbies, setHobbies] = useState('')
  const [profileText, setProfileText] = useState('')
  const [conversation, setConversation] = useState<{ id?: string; sender: 'me' | 'them'; text: string; createdAt: string }[]>([])
  const [savingLatest, setSavingLatest] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // プロフィール読み込み
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        if (data.target_relation && RELATION_MAP[data.target_relation]) {
          setRelation(RELATION_MAP[data.target_relation])
        }
        if (data.target_age) setModalAge(data.target_age)
        if (data.target_area) setArea(data.target_area)
        if (data.target_hobbies) setHobbies(data.target_hobbies)
        if (data.target_profile_text) setProfileText(data.target_profile_text)
        setProfileFilled(true)
      }

      // 会話履歴読み込み
      const { data: firstApproach } = await supabase
        .from('messages')
        .select('used_message, created_at')
        .eq('user_id', user.id)
        .eq('type', 'first_approach')
        .maybeSingle()

      const { data: replies } = await supabase
        .from('messages')
        .select('id, reply_text, used_message, created_at')
        .eq('user_id', user.id)
        .eq('type', 'reply')
        .order('created_at', { ascending: true })

      const items: { id?: string; sender: 'me' | 'them'; text: string; createdAt: string }[] = []
      if (firstApproach?.used_message) {
        items.push({ sender: 'me', text: firstApproach.used_message, createdAt: firstApproach.created_at })
      }
      for (const reply of replies ?? []) {
        if (reply.reply_text) items.push({ id: reply.id, sender: 'them', text: reply.reply_text, createdAt: reply.created_at })
        if (reply.used_message) items.push({ sender: 'me', text: reply.used_message, createdAt: reply.created_at })
      }
      setConversation(items)
    }
    loadAll()
  }, [])

  async function saveLatestMessage() {
    if (!latestMessage.trim()) return
    setSavingLatest(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: inserted } = await supabase
        .from('messages')
        .insert({ user_id: user.id, type: 'reply', reply_text: latestMessage })
        .select('id')
        .single()
      const now = new Date().toISOString()
      setConversation((prev) => [...prev, { id: inserted?.id, sender: 'them', text: latestMessage, createdAt: now }])
      setLatestMessage('')
    }
    setSavingLatest(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setGenerating(false); return }

    const latestThemMessage = [...conversation].reverse().find((c) => c.sender === 'them')
    const latestThemId = latestThemMessage?.id

    const { data, error: fnError } = await supabase.functions.invoke('generate-reply', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        conversationHistory: conversation.map((c) => ({ sender: c.sender, text: c.text })),
        latestMessage: latestThemMessage?.text ?? '',
        count,
        purpose,
        tone,
        targetRelation: Object.entries(RELATION_MAP).find(([, v]) => v === relation)?.[0],
        targetAge: modalAge,
        targetArea: area,
        targetHobbies: hobbies,
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

    // 最新の相手メッセージレコードにパターンを保存
    if (latestThemId) {
      await supabase.from('messages').update({
        pattern_a: patterns[0]?.message ?? null,
        pattern_b: patterns[1]?.message ?? null,
        pattern_c: patterns[2]?.message ?? null,
        tone_a: patterns[0]?.tone ?? null,
        tone_b: patterns[1]?.tone ?? null,
        tone_c: patterns[2]?.tone ?? null,
      }).eq('id', latestThemId)
    }

    setGenerating(false)
    navigate('/reply-result', {
      state: {
        patterns,
        messageId: latestThemId,
        latestMessage: latestThemMessage?.text ?? '',
        count,
        purpose,
        tone,
        conversationHistory: conversation.map((c) => ({ sender: c.sender, text: c.text })),
        targetRelation: Object.entries(RELATION_MAP).find(([, v]) => v === relation)?.[0],
        targetAge: modalAge,
        targetArea: area,
        targetHobbies: hobbies,
      },
    })
  }

  async function deleteReply(id: string) {
    await supabase.from('messages').delete().eq('id', id)
    setConversation((prev) => prev.filter((item) => item.id !== id))
  }

  async function saveEdit(id: string) {
    if (!editingText.trim()) return
    await supabase.from('messages').update({ reply_text: editingText }).eq('id', id)
    setConversation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: editingText } : item))
    )
    setEditingId(null)
    setEditingText('')
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const relationKey = Object.entries(RELATION_MAP).find(([, v]) => v === relation)?.[0]
      await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          target_relation: relationKey,
          target_age: modalAge,
          target_area: area,
          target_hobbies: hobbies,
          target_profile_text: profileText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    }
    setProfileFilled(true)
    setShowModal(false)
  }

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="frame mb-4">
          {/* ナビ */}
          <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
            <button
              onClick={() => navigate('/home')}
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
              onClick={() => navigate('/home')}
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
            {/* Tip */}
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
              {!profileFilled ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-md border border-black/20 bg-surface p-[12px_14px] hover:bg-[#e8e6df]"
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
                  onClick={() => setShowModal(true)}
                  className="flex w-full cursor-pointer items-center justify-between gap-[10px] rounded-md border border-brand-border bg-brand-light p-[12px_14px]"
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
                      <div className="text-[13px] font-medium text-brand-dark">入力済み</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {[relation, `${modalAge}歳`, area].map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-[#CECBF6] px-2 py-0.5 text-[11px] text-brand-dark"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-normal text-brand">編集 ›</span>
                </button>
              )}
              <p className="mt-1 text-[11px] text-ink-tertiary">
                初回アプローチと同じ相手の場合は引き継がれます
              </p>
            </div>

            {/* 相手の最新メッセージ */}
            <div className="mb-[18px]">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
                相手の最新メッセージ <Badge required />
              </p>
              <textarea
                rows={3}
                value={latestMessage}
                onChange={(e) => setLatestMessage(e.target.value)}
                placeholder="例：そうなんだ〜、週末何してるの？"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-ink-tertiary">相手のメッセージをそのままコピペしてください</p>
                <button
                  onClick={saveLatestMessage}
                  disabled={savingLatest || !latestMessage.trim()}
                  className="cursor-pointer rounded-md border border-black/20 bg-transparent px-3 py-1.5 text-xs text-ink-secondary transition-all hover:bg-surface disabled:opacity-40"
                >
                  {savingLatest ? '保存中...' : '保存'}
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
                        <span className="whitespace-nowrap text-[10px] text-ink-tertiary">{formatDate(item.createdAt)}</span>
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
                                onClick={() => { setEditingId(null); setEditingText('') }}
                                className="cursor-pointer rounded border border-black/10 bg-transparent px-2 py-0.5 text-[10px] text-ink-tertiary hover:bg-surface"
                              >
                                キャンセル
                              </button>
                              <button
                                onClick={() => saveEdit(item.id!)}
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
                          <span className="whitespace-nowrap text-[10px] text-ink-tertiary">{formatDate(item.createdAt)}</span>
                          {item.id && editingId !== item.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingId(item.id!); setEditingText(item.text) }}
                                className="cursor-pointer rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-[10px] text-ink-tertiary hover:border-brand-border hover:text-brand"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => deleteReply(item.id!)}
                                className="cursor-pointer rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-[10px] text-ink-tertiary hover:border-danger-border hover:text-danger-text"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
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
                    className={`cursor-pointer rounded-full border px-[14px] py-1.5 text-xs transition-all ${
                      count === c
                        ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                        : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                    }`}
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
                    className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all hover:bg-surface ${
                      purpose === label ? 'border-brand-border bg-brand-light' : 'border-black/10'
                    }`}
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
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`cursor-pointer rounded-full border px-[14px] py-1.5 text-xs transition-all ${
                      tone === t
                        ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                        : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <p className="mb-3 text-center text-xs text-danger-text">{genError}</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || !conversation.some((c) => c.sender === 'them') || count === null || purpose === null}
              className="w-full cursor-pointer rounded-md border-none bg-brand py-[13px] text-sm font-medium text-brand-light transition-colors hover:bg-brand-dark disabled:opacity-40"
            >
              {generating ? '生成中...' : '返信を生成する'}
            </button>
          </div>
        </div>
      </div>

      {/* プロフィールモーダル */}
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
              {/* 関係値 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  関係値 <span className="text-[10px] text-ink-tertiary">必須</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONS.map(({ label, sub }) => (
                    <button
                      key={label}
                      onClick={() => setRelation(label)}
                      className={`cursor-pointer rounded-md border p-[10px_12px] text-center transition-all ${
                        relation === label
                          ? 'border-brand-border bg-brand-light'
                          : 'border-black/10 hover:bg-surface'
                      }`}
                    >
                      <p
                        className={`mb-0.5 text-xs font-medium ${relation === label ? 'text-brand-dark' : 'text-ink'}`}
                      >
                        {label}
                      </p>
                      <span className="text-[11px] text-ink-secondary">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 年齢 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  年齢 <span className="text-[10px] text-ink-tertiary">任意</span>
                </label>
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

              {/* エリア */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  居住エリア <span className="text-[10px] text-ink-tertiary">任意</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setArea(a)}
                      className={`cursor-pointer rounded-full border px-3 py-[5px] text-xs transition-all ${
                        area === a
                          ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                          : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* 趣味 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  趣味・好きなこと <span className="text-[10px] text-ink-tertiary">任意</span>
                </label>
                <textarea rows={2} value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="例：カフェ巡り、映画鑑賞" />
              </div>

              {/* プロフィール文 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  プロフィール文（あれば）{' '}
                  <span className="text-[10px] text-ink-tertiary">任意</span>
                </label>
                <textarea rows={2} value={profileText} onChange={(e) => setProfileText(e.target.value)} placeholder="プロフィールをそのままコピペでもOK" />
              </div>

              <button
                onClick={saveProfile}
                className="w-full cursor-pointer rounded-md border-none bg-brand py-3 text-sm font-medium text-brand-light transition-colors hover:bg-brand-dark"
              >
                保存して戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
