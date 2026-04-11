# Supabase テーブル構成

## messages テーブル

| column_name  | data_type                | is_nullable | column_default    |
|--------------|--------------------------|-------------|-------------------|
| id           | uuid                     | NO          | gen_random_uuid() |
| user_id      | uuid                     | NO          | null              |
| type         | text                     | NO          | null              |
| pattern_a    | text                     | YES         | null              |
| pattern_b    | text                     | YES         | null              |
| pattern_c    | text                     | YES         | null              |
| tone_a       | text                     | YES         | null              |
| tone_b       | text                     | YES         | null              |
| tone_c       | text                     | YES         | null              |
| used_pattern | text                     | YES         | null              |
| feedback     | text                     | YES         | null              |
| reply_text   | text                     | YES         | null              |
| created_at   | timestamp with time zone | YES         | now()             |

- `type`: メッセージ種別（`first_approach` / `reply`）
- `pattern_a/b/c`: AIが生成した3パターンのメッセージ本文
- `tone_a/b/c`: 各パターンのトーンラベル（例: 「積極的」）
- `used_pattern`: ユーザーが実際に使ったパターン（`a` / `b` / `c`）
- `feedback`: 送った結果（`yes` / `no` / `pending`）
- `reply_text`: 相手から来たメッセージ（`reply` 時のみ使用、`first_approach` は null）

## profiles テーブル

| column_name         | data_type                | is_nullable | column_default    |
|---------------------|--------------------------|-------------|-------------------|
| id                  | uuid                     | NO          | gen_random_uuid() |
| user_id             | uuid                     | NO          | null              |
| my_age              | integer                  | YES         | null              |
| my_job              | text                     | YES         | null              |
| my_hobbies          | text                     | YES         | null              |
| tone                | text                     | YES         | null              |
| target_relation     | text                     | YES         | null              |
| target_age          | integer                  | YES         | null              |
| target_area         | text                     | YES         | null              |
| target_hobbies      | text                     | YES         | null              |
| target_profile_text | text                     | YES         | null              |
| updated_at          | timestamp with time zone | YES         | now()             |
