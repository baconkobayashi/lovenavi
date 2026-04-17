# Supabase テーブル構成

## テーブル関係図

```
auth.users
  └── profiles          (1:1)  自分の情報
  └── targets           (1:多) 相手ごとのプロフィール
        └── messages    (1:多) AIが生成したメッセージ（自分のターン）
        └── conversation_turns (1:多) やりとりの全ターン（自分・相手）
```

---

## profiles テーブル

自分（ログインユーザー）の情報。1ユーザーにつき1行。

| column_name | data_type                | is_nullable | column_default    |
|-------------|--------------------------|-------------|-------------------|
| id          | uuid                     | NO          | gen_random_uuid() |
| user_id     | uuid                     | NO          | null              |
| my_age      | integer                  | YES         | null              |
| my_job      | text                     | YES         | null              |
| my_hobbies  | text                     | YES         | null              |
| tone        | text                     | YES         | null              |
| updated_at  | timestamp with time zone | YES         | now()             |

- `tone`: キャラ設定（`aggressive` / `reserved` / `humorous` / `sincere`）

---

## targets テーブル

相手（アプローチ対象）の情報。1ユーザーにつき複数行。

| column_name  | data_type                | is_nullable | column_default    |
|--------------|--------------------------|-------------|-------------------|
| id           | uuid                     | NO          | gen_random_uuid() |
| user_id      | uuid                     | NO          | null              |
| nickname     | text                     | NO          | null              |
| relation     | text                     | YES         | null              |
| age          | integer                  | YES         | null              |
| area         | text                     | YES         | null              |
| hobbies      | text                     | YES         | null              |
| profile_text | text                     | YES         | null              |
| created_at   | timestamp with time zone | NO          | now()             |
| updated_at   | timestamp with time zone | NO          | now()             |

- `nickname`: 相手の呼び名（例: 「カフェさん」「田中さん」）
- `relation`: 関係値（`matching` / `chatted` / `met` / `dating`）

---

## messages テーブル

AIが生成したメッセージ（自分のターン）。1ターゲットにつき複数行。

| column_name  | data_type                | is_nullable | column_default    |
|--------------|--------------------------|-------------|-------------------|
| id           | uuid                     | NO          | gen_random_uuid() |
| user_id      | uuid                     | NO          | null              |
| target_id    | uuid                     | YES         | null              |
| type         | text                     | NO          | null              |
| pattern_a    | text                     | YES         | null              |
| pattern_b    | text                     | YES         | null              |
| pattern_c    | text                     | YES         | null              |
| tone_a       | text                     | YES         | null              |
| tone_b       | text                     | YES         | null              |
| tone_c       | text                     | YES         | null              |
| used_pattern | text                     | YES         | null              |
| used_message | text                     | YES         | null              |
| feedback     | text                     | YES         | null              |
| created_at   | timestamp with time zone | YES         | now()             |

- `target_id`: 紐づく相手（targets.id）
- `type`: メッセージ種別（`first_approach` / `reply`）
- `pattern_a/b/c`: AIが生成した3パターンのメッセージ本文
- `tone_a/b/c`: 各パターンのトーンラベル（例: 「積極的」）
- `used_pattern`: 実際に使ったパターン（`a` / `b` / `c`）
- `used_message`: 実際に送ったメッセージのテキスト
- `feedback`: このメッセージへの結果（`yes` / `no` / `pending`）

---

## conversation_turns テーブル

やりとりの全ターン（自分・相手の両方）。1ターゲットにつき複数行、時系列順。

| column_name | data_type                | is_nullable | column_default    |
|-------------|--------------------------|-------------|-------------------|
| id          | uuid                     | NO          | gen_random_uuid() |
| user_id     | uuid                     | NO          | null              |
| target_id   | uuid                     | NO          | null              |
| message_id  | uuid                     | YES         | null              |
| sender      | text                     | NO          | null              |
| raw_text    | text                     | YES         | null              |
| feedback    | text                     | YES         | null              |
| created_at  | timestamp with time zone | NO          | now()             |

- `target_id`: 紐づく相手（targets.id）
- `message_id`: `sender='me'` のとき、対応する messages.id
- `sender`: 送信者（`me` = 自分 / `target` = 相手）
- `raw_text`: 相手のメッセージ本文（`sender='target'` のときのみ使用）
- `feedback`: 自分のターンに対する返信結果（`yes` / `no` / `pending`）。`sender='me'` のときのみ設定。

### やりとりのイメージ

```
sender  | raw_text / message_id        | feedback
--------|------------------------------|----------
me      | message_id → messages.id     | pending  ← 初回アプローチを送った
target  | raw_text: 「こんにちは！」    | null
me      | message_id → messages.id     | yes      ← 返信を送ったら相手から返信きた
target  | raw_text: 「週末空いてる？」  | null
me      | message_id → messages.id     | pending  ← さらに返信を送った
```
