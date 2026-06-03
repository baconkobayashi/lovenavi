import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ログイン済みチェック
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      targetRelation,
      targetAge,
      targetArea,
      targetHobbies,
      targetProfileText,
      myAge,
      myJob,
      myHobbies,
      tone,
    } = await req.json()

    const toneLabel =
      tone === 'aggressive' ? '積極的・グイグイいくタイプ'
      : tone === 'reserved' ? '控えめ・ゆっくり距離を縮めるタイプ'
      : tone === 'humorous' ? 'ユーモア系・笑いを取りに行くタイプ'
      : '誠実系・真面目・丁寧な印象'

    const prompt = `
あなたはマッチングアプリの初回メッセージ作成の専門家です。
以下の情報をもとに、好印象を与える初回メッセージを3パターン作成してください。

【相手の情報】
- 関係値: ${targetRelation}
- 年齢: ${targetAge}歳
- 居住エリア: ${targetArea}
- 趣味・好きなこと: ${targetHobbies || '不明'}
- プロフィール文: ${targetProfileText || 'なし'}

【自分の情報】
- 年齢: ${myAge}歳
- 職業: ${myJob}
- 趣味・好きなこと: ${myHobbies || '不明'}
- キャラ設定: ${toneLabel}

【実際の女性の声に基づく品質基準】
良いメッセージの条件：
- プロフィールの1項目を選んで具体的に言及する（全項目の列挙は不可）
- 自分のことを少し開示しながら質問する（「私も〇〇です。〇〇さんは？」の形）
- 質問は1つだけ、答えやすいもの（「最近〇〇しましたか？」「最近気になる〇〇は？」）
- 「はじめまして」の挨拶と丁寧な敬語は必須
- なぜメッセージしたかの理由が伝わる内容にする
- 「もしよろしければ」「ゆっくりお話しできたら」など距離感を保つ表現を使う

避けるべき表現：
- 誰にでも送れる曖昧な褒め言葉（「プロフィールに惹かれました」だけ）
- 「おすすめを教えてください」（回答負担が大きい）
- 複数の質問を一度に並べる（質問攻め）
- タメ口・ニックネーム呼び
- 初手でのデート・会う提案
- 相手の基本情報（年齢・住まい）をそのまま列挙する表現
- ビジネス的な締め（「どうぞよろしくお願いします」）
- 「もちろん無理にとは言いません」など過剰な低姿勢

【出力形式】
以下のJSON形式で出力してください。JSONのみ出力し、説明文は不要です。
{
  "patterns": [
    { "tone": "パターンの特徴（10文字以内）", "message": "メッセージ本文" },
    { "tone": "パターンの特徴（10文字以内）", "message": "メッセージ本文" },
    { "tone": "パターンの特徴（10文字以内）", "message": "メッセージ本文" }
  ]
}

【注意】
- 各メッセージは自然な日本語で、50〜120文字程度
- 馴れ馴れしすぎず、押しつけがましくない
- 相手のプロフィールに言及する内容を含める
- JSONのみ出力すること
`

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8 },
        }),
      }
    )

    const json = await res.json()
    console.log('Gemini status:', res.status)
    console.log('Gemini response:', JSON.stringify(json))

    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) {
      throw new Error(`Gemini returned empty response: ${JSON.stringify(json)}`)
    }
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
