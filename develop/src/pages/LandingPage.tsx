import { useState } from 'react'
import { supabase } from '../lib/supabase'

const IconChat = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#534AB7"
    strokeWidth="1.5"
    strokeLinecap="round"
    className="h-4 w-4"
  >
    <path d="M2 8C2 4.7 4.7 2 8 2s6 2.7 6 6-2.7 6-6 6H2.5L2 14V8z" />
  </svg>
)

const IconMail = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="#534AB7"
    strokeWidth="1.5"
    strokeLinecap="round"
    className="h-4 w-4"
  >
    <path d="M14 3H2v8h4l2 2 2-2h4V3z" />
    <path d="M5 7h6M5 5h4" />
  </svg>
)

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/home`,
    },
  })
}

export default function LandingPage() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="flex min-h-screen justify-center bg-page px-4 py-8">
      <div className="w-full max-w-[480px]">
        {/* ナビゲーションバー */}
        <div className="frame mb-3">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <span className="text-[15px] font-medium">lovenavigation</span>
            <div className="flex gap-2">
              <button
                onClick={signInWithGoogle}
                className="cursor-pointer rounded-md border border-black/20 bg-transparent px-[14px] py-[5px] text-xs text-ink"
              >
                ログイン
              </button>
              <button
                onClick={signInWithGoogle}
                className="cursor-pointer rounded-md border border-brand bg-brand px-[14px] py-[5px] text-xs text-brand-light"
              >
                無料で始める
              </button>
            </div>
          </div>
        </div>

        {/* ヒーローセクション */}
        <div className="frame mb-3">
          <div className="border-b border-black/10 px-6 pb-8 pt-10 text-center">
            <span className="mb-4 inline-block rounded-full bg-brand-light px-3 py-1 text-[11px] font-medium text-brand-dark">
              実際の女性の声をAIに学習
            </span>
            <h1 className="mb-3 text-[22px] font-medium leading-[1.4] text-ink">
              マッチングアプリで
              <br />
              もう返信に悩まない
            </h1>
            <p className="mb-6 text-[13px] leading-[1.7] text-ink-secondary">
              相手の情報を入れるだけで、好印象を与える
              <br />
              メッセージを自動生成します。
            </p>
            <button
              onClick={signInWithGoogle}
              className="mb-2 block w-full cursor-pointer rounded-md border-none bg-brand py-3 text-sm font-medium text-brand-light"
            >
              無料で始める
            </button>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="block w-full cursor-pointer rounded-md border border-black/10 bg-transparent py-[10px] text-[13px] text-ink-secondary"
            >
              {showGuide ? '閉じる ▲' : '使い方を見る ▼'}
            </button>
          </div>
          <div className="border-b border-black/10 px-5 py-4">
            <div className="flex items-center gap-1">
              {['A', 'B', 'C', 'D'].map((l) => (
                <span
                  key={l}
                  className="-ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-white bg-surface text-[10px] text-ink-secondary first:ml-0"
                >
                  {l}
                </span>
              ))}
              <span className="ml-1 text-xs text-ink-secondary">
                すでに <strong>〇〇人</strong> が利用中
              </span>
            </div>
          </div>
        </div>

        {/* 機能紹介〜最終CTA（使い方を見るで表示） */}
        {showGuide && (
          <>
            {/* 機能紹介セクション */}
            <div className="frame mb-3">
              <div className="p-5 pb-2">
                <p className="mb-4 text-center text-base font-medium text-ink">
                  2つの機能でサポート
                </p>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-light">
                    <IconChat />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[13px] font-medium text-ink">初回アプローチ生成</p>
                    <p className="text-xs leading-[1.5] text-ink-secondary">
                      相手のプロフィールを入力するだけで、自然で好印象を与える最初のメッセージを自動生成。
                    </p>
                  </div>
                </div>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-light">
                    <IconMail />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[13px] font-medium text-ink">返信メッセージ生成</p>
                    <p className="text-xs leading-[1.5] text-ink-secondary">
                      相手の返信と目的（デート誘いたい
                      etc.）を入れると、状況に合った返信を3パターン提案。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 使い方セクション */}
            <div className="frame mb-3">
              <div className="p-5">
                <p className="mb-4 text-center text-base font-medium text-ink">3ステップで使える</p>
                {[
                  { n: 1, text: '相手の情報を入力', sub: '年齢・趣味・返信内容など' },
                  { n: 2, text: 'AIがメッセージを生成', sub: '3パターンの候補を提示' },
                  {
                    n: 3,
                    text: '気に入ったものをコピーして送信',
                    sub: '結果を報告するとAIが賢くなる',
                  },
                ].map(({ n, text, sub }) => (
                  <div key={n} className="mb-4 flex items-start gap-3 last:mb-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-medium text-brand">
                      {n}
                    </div>
                    <div>
                      <div className="pt-0.5 text-[13px] leading-[1.5] text-ink">{text}</div>
                      <div className="mt-0.5 text-xs text-ink-secondary">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ユーザーの声 */}
            <div className="frame mb-3">
              <div className="p-5">
                <p className="mb-4 text-center text-base font-medium text-ink">使った人の声</p>
                {[
                  {
                    text: '「最初のメッセージで悩む時間がゼロになった。マッチ後の返信率が明らかに上がった気がする。」',
                    user: '20代・会社員',
                  },
                  {
                    text: '「3パターン出てきて選べるのが便利。自分じゃ思いつかない切り口があって面白い。」',
                    user: '30代・フリーランス',
                  },
                ].map(({ text, user }) => (
                  <div
                    key={user}
                    className="mb-[10px] rounded-md bg-surface px-[14px] py-3 last:mb-0"
                  >
                    <p className="mb-2 text-xs leading-[1.6] text-ink">{text}</p>
                    <span className="text-[11px] text-ink-tertiary">{user}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 最終CTA */}
            <div className="frame mb-3">
              <div className="px-6 py-8 text-center">
                <p className="mb-2 text-base font-medium text-ink">まずは無料で試してみる</p>
                <p className="mb-5 text-xs text-ink-secondary">
                  クレジットカード不要・30秒で登録完了
                </p>
                <button
                  onClick={signInWithGoogle}
                  className="mx-auto mb-2 block w-full max-w-[280px] cursor-pointer rounded-md border-none bg-brand py-3 text-sm font-medium text-brand-light"
                >
                  Googleアカウントで始める
                </button>
                <p className="text-[11px] text-ink-tertiary">
                  登録することで利用規約・プライバシーポリシーに同意したことになります
                </p>
              </div>
            </div>
          </>
        )}

        {/* フッター */}
        <div className="frame">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-xs text-ink-tertiary">© 2025 lovenavigation</span>
            <div className="flex gap-3">
              {['利用規約', 'プライバシーポリシー', 'お問い合わせ'].map((l) => (
                <span key={l} className="cursor-pointer text-[11px] text-ink-tertiary">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
