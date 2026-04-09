import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PATTERNS = [
  {
    id: 1,
    label: 'パターン A',
    tone: '共通点を活かす',
    message:
      '「プロフィール見てたらカフェ好きって書いてましたね！自分もよく新しいカフェ開拓してて、○○さんのおすすめ聞いてみたいです。よかったらいろいろ教えてください！」',
  },
  {
    id: 2,
    label: 'パターン B',
    tone: '質問で引き込む',
    message:
      '「はじめまして！映画好きって書いてましたが、最近観た中でおすすめってありますか？自分もよく観るんですが、最近ちょうどいい作品探してて。」',
  },
  {
    id: 3,
    label: 'パターン C',
    tone: 'シンプル・自然',
    message:
      '「はじめまして！プロフィール読んでいて、なんか話してみたいなって思いました。カフェとか映画とかよく行くんですか？」',
  },
]

const AREAS = ['東京', '神奈川', '大阪', 'その他']
const CHARS = ['積極的', '控えめ', 'ユーモア系', '誠実系']

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
  const [selected, setSelected] = useState(1)
  const [copied, setCopied] = useState<number | null>(null)
  const [used, setUsed] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [feedback, setFeedback] = useState<'yes' | 'no' | 'pending' | null>(null)
  const [showRegen, setShowRegen] = useState(false)
  const [regenArea, setRegenArea] = useState('東京')
  const [regenChar, setRegenChar] = useState('積極的')
  const [regenHobbies, setRegenHobbies] = useState('カフェ・映画')

  function handleCopy(id: number) {
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleUsed(id: number) {
    if (used === id) return
    setUsed(id)
    setSelected(id)
    setTimeout(() => setShowModal(true), 400)
  }

  function handleFeedback(type: 'yes' | 'no' | 'pending') {
    setFeedback(type)
    setTimeout(() => setShowModal(false), 800)
  }

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="frame mb-4">
          {/* ナビ */}
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
            {/* コンテキスト */}
            <div className="mb-4 flex items-center justify-between rounded-md bg-surface p-[10px_12px]">
              <div className="flex flex-wrap gap-1.5">
                {['25歳', '東京', 'カフェ・映画', '積極的'].map((t) => (
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

            {/* カード */}
            {PATTERNS.map(({ id, label, tone, message }) => (
              <div
                key={id}
                onClick={() => setSelected(id)}
                className={`mb-[10px] cursor-pointer rounded-lg border p-[14px] transition-all ${
                  selected === id
                    ? 'border-2 border-brand-border bg-brand-light'
                    : 'border border-black/10 bg-white hover:border-black/25'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-[10px] py-[3px] text-[11px] font-medium ${
                      selected === id
                        ? 'bg-brand-border text-brand-darker'
                        : 'bg-surface text-ink-secondary'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="rounded-full border border-black/10 px-2 py-[2px] text-[10px] text-ink-tertiary">
                    {tone}
                  </span>
                </div>
                <p
                  className={`mb-3 text-[13px] leading-[1.7] ${selected === id ? 'text-brand-darker' : 'text-ink'}`}
                >
                  {message}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(id)
                    }}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border py-2 text-xs transition-all ${
                      copied === id
                        ? 'border-success-border bg-success-bg text-success-text'
                        : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                    }`}
                  >
                    {copied === id ? <CheckIcon /> : <CopyIcon />}
                    {copied === id ? 'コピー済み' : 'コピー'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUsed(id)
                    }}
                    className={`flex-1 cursor-pointer rounded-md border-none py-2 text-xs font-medium transition-all ${
                      used === id
                        ? 'border border-success-border bg-success-bg text-success-text'
                        : 'bg-brand text-brand-light hover:bg-brand-dark'
                    }`}
                  >
                    {used === id ? '使った' : 'これを使う'}
                  </button>
                </div>
              </div>
            ))}

            {/* 再生成ボタン */}
            <button
              onClick={() => setShowRegen(!showRegen)}
              className="mt-1 w-full cursor-pointer rounded-md border border-black/20 bg-transparent py-[11px] text-[13px] text-ink-secondary hover:bg-surface"
            >
              条件を変えてもう一度生成する ↓
            </button>

            {/* 再生成パネル */}
            {showRegen && (
              <div className="mt-3 overflow-hidden rounded-lg border border-black/10">
                <div className="border-b border-black/10 bg-surface px-[14px] py-3 text-xs font-medium text-ink-secondary">
                  条件を編集して再生成
                </div>
                <div className="flex flex-col gap-3 p-[14px]">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">居住エリア</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AREAS.map((a) => (
                        <button
                          key={a}
                          onClick={() => setRegenArea(a)}
                          className={`cursor-pointer rounded-full border px-3 py-[5px] text-xs transition-all ${
                            regenArea === a
                              ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                              : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">キャラ設定</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CHARS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setRegenChar(c)}
                          className={`cursor-pointer rounded-full border px-3 py-[5px] text-xs transition-all ${
                            regenChar === c
                              ? 'border-brand-border bg-brand-light font-medium text-brand-dark'
                              : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">
                      趣味・好きなこと
                    </label>
                    <input
                      type="text"
                      value={regenHobbies}
                      onChange={(e) => setRegenHobbies(e.target.value)}
                      placeholder="例：カフェ巡り、映画"
                    />
                  </div>
                  <button
                    onClick={() => setShowRegen(false)}
                    className="w-full cursor-pointer rounded-md border-none bg-brand py-[11px] text-[13px] font-medium text-brand-light"
                  >
                    この条件で再生成する
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フィードバックモーダル */}
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
                    active: 'bg-success-bg border-success-border text-success-text',
                  },
                  {
                    key: 'pending',
                    label: 'まだ待ち中',
                    active: 'bg-warn-bg border-warn-border text-warn-text',
                  },
                  {
                    key: 'no',
                    label: '既読スルー',
                    active: 'bg-danger-bg border-danger-border text-danger-text',
                  },
                ] as const
              ).map(({ key, label, active }) => (
                <button
                  key={key}
                  onClick={() => handleFeedback(key)}
                  className={`flex-1 cursor-pointer rounded-md border px-1.5 py-3 text-center text-[13px] font-medium transition-all ${
                    feedback === key
                      ? active
                      : 'border-black/20 bg-transparent text-ink hover:bg-surface'
                  }`}
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
  )
}
