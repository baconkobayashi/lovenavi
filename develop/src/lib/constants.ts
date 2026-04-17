export type Tone = 'aggressive' | 'reserved' | 'humorous' | 'sincere'
export type Job = '会社員' | 'フリーランス' | '公務員' | '経営者・自営業' | 'その他'
export type Relation = 'matching' | 'chatted' | 'met' | 'dating'
export type Area = '東京' | '神奈川' | '大阪' | '名古屋' | 'その他'

export const MY_TONES: { key: Tone; label: string; sub: string }[] = [
  { key: 'aggressive', label: '積極的', sub: 'グイグイいくタイプ' },
  { key: 'reserved', label: '控えめ', sub: 'ゆっくり距離を縮める' },
  { key: 'humorous', label: 'ユーモア系', sub: '笑いを取りに行く' },
  { key: 'sincere', label: '誠実系', sub: '真面目・丁寧な印象' },
]

export const JOBS: Job[] = ['会社員', 'フリーランス', '公務員', '経営者・自営業', 'その他']

export const AREAS: Area[] = ['東京', '神奈川', '大阪', '名古屋', 'その他']

export const RELATIONS: { key: Relation; label: string; sub: string }[] = [
  { key: 'matching', label: 'マッチング直後', sub: 'まだ会話していない' },
  { key: 'chatted', label: '数回やり取り済み', sub: '少し話したことある' },
  { key: 'met', label: '会ったことある', sub: 'オフラインで会った' },
  { key: 'dating', label: '付き合い中', sub: '交際中のやり取り' },
]

export const TARGET_TONES = ['テンション高め', '普通', '素っ気ない', 'わからない'] as const
export type TargetTone = (typeof TARGET_TONES)[number]
