export type FeedbackType = 'yes' | 'no' | 'pending'
export type SenderType = 'me' | 'target'
export type MessageType = 'first_approach' | 'reply'

export interface Target {
  id: string
  user_id: string
  nickname: string
  relation: string | null
  age: number | null
  area: string | null
  hobbies: string | null
  profile_text: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  user_id: string
  target_id: string | null
  type: MessageType
  pattern_a: string | null
  tone_a: string | null
  pattern_b: string | null
  tone_b: string | null
  pattern_c: string | null
  tone_c: string | null
  used_pattern: 'a' | 'b' | 'c' | null
  used_message: string | null
  feedback: FeedbackType | null
  created_at: string
}

export interface ConversationTurn {
  id: string
  user_id: string
  target_id: string
  message_id: string | null   // sender='me' のとき messages.id を参照
  sender: SenderType
  raw_text: string | null      // sender='target' のとき相手のメッセージ本文
  feedback: FeedbackType | null // sender='me' のとき相手が返信したか
  created_at: string
}
