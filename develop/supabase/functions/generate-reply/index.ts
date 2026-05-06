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
      conversationHistory,
      latestMessage,
      count,
      purpose,
      tone,
      targetRelation,
      targetAge,
      targetArea,
      targetHobbies,
    } = await req.json()

    const HISTORY_LIMIT = 10

    const feedbackLabel: Record<string, string> = {
      yes: '✓返信あり',
      no: '✗既読スルー',
      pending: '△待ち中',
    }
    const historyText = (conversationHistory as { sender: string; text: string; feedback?: string | null }[])
      .slice(-HISTORY_LIMIT)
      .map((c) => {
        const label = c.sender === 'me' && c.feedback ? ` [${feedbackLabel[c.feedback] ?? ''}]` : ''
        return `${c.sender === 'me' ? '自分' : '相手'}: ${c.text}${label}`
      })
      .join('\n')

    const prompt = `
あなたはマッチングアプリの返信メッセージ作成の専門家です。
以下の情報をもとに、返信メッセージを3パターン作成してください。

【これまでの会話の流れ】
${historyText || 'なし'}

【相手の最新メッセージ】
${latestMessage}

【条件】
- やり取り回数: ${count}
- 今回の目的: ${purpose}
- 相手のトーン: ${tone || '不明'}

【相手の情報】
- 関係値: ${targetRelation || '不明'}
- 年齢: ${targetAge ? `${targetAge}歳` : '不明'}
- 居住エリア: ${targetArea || '不明'}
- 趣味・好きなこと: ${targetHobbies || '不明'}

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
- 各メッセージは自然な日本語で、30〜100文字程度
- 相手のメッセージに自然に返す内容にする
- 目的（${purpose}）を意識した内容にする
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
