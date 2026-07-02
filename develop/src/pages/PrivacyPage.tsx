import LegalLayout, { Section, Highlight, Important } from '../components/LegalLayout'

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border border-brand-border bg-brand-light px-3 py-2 text-left font-medium text-brand-dark"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`border border-black/10 px-3 py-2 align-top text-ink-secondary ${i % 2 === 1 ? 'bg-surface' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="プライバシーポリシー"
      meta="制定日：2025年●月●日　最終更新：2025年●月●日"
      footerLink={{ label: '利用規約', to: '/terms' }}
    >
      <div className="border-b border-black/10 px-6 py-5 text-[14px] leading-[1.8] text-ink-secondary sm:px-8">
        株式会社BACON（以下「当社」といいます）は、「lovenavi」（以下「本サービス」といいます）において、ユーザーの個人情報の取り扱いを以下のとおり定めます。本サービスの利用にあたり、本ポリシーをご確認のうえご同意ください。
      </div>

      <Section num="1" title="取得する情報">
        <p>当社は、本サービスの提供にあたり以下の情報を取得します。</p>
        <DataTable
          headers={['情報の種類', '具体的な内容', '取得方法']}
          rows={[
            [
              'アカウント情報',
              '氏名・メールアドレス・プロフィール画像（Googleアカウントより取得）',
              'Google OAuth認証',
            ],
            [
              '入力情報',
              '相手のニックネーム・年齢・居住エリア・趣味・プロフィール文・メッセージ内容',
              'ユーザーによる入力',
            ],
            ['自己情報', 'ユーザー自身の年齢・職業・趣味・キャラ設定', 'ユーザーによる入力'],
            [
              '行動ログ',
              '生成したメッセージ・選択したパターン・フィードバック（返信きた等）・操作履歴',
              'サービス利用時に自動記録',
            ],
            [
              '端末・通信情報',
              'IPアドレス・ブラウザ種別・OS・アクセス日時',
              'サービス利用時に自動記録',
            ],
          ]}
        />
        <Important>
          相手方の氏名・住所・電話番号・SNSアカウントなどの特定個人を識別できる情報の入力はお控えください。入力された情報はサービス向上のため利用される場合があります。
        </Important>
      </Section>

      <Section num="2" title="情報の利用目的">
        <p>取得した情報は以下の目的で利用します。</p>
        <ol>
          <li>
            <strong>サービスの提供</strong>：メッセージ生成・履歴管理・マイページ機能の提供
          </li>
          <li>
            <strong>サービスの改善・AI学習</strong>
            ：生成精度の向上、AIモデルのFine-tuning（SFT・DPO）への利用
          </li>
          <li>
            <strong>統計・分析</strong>：利用動向の分析（個人を特定できない形に加工して使用）
          </li>
          <li>
            <strong>サポート対応</strong>：お問い合わせへの回答・不正利用の調査
          </li>
          <li>
            <strong>通知・連絡</strong>：サービス変更・メンテナンス・重要なお知らせの通知
          </li>
        </ol>
        <Highlight>
          行動ログ（選択したメッセージパターン・フィードバック結果など）は、AIの学習データとして利用されます。これによりサービスの精度向上が図られます。学習への利用を希望されない場合はお問い合わせください。
        </Highlight>
      </Section>

      <Section num="3" title="第三者への提供">
        <p>当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
        <ul>
          <li>ユーザー本人の同意がある場合</li>
          <li>法令に基づき開示が必要な場合（捜査機関からの要請等）</li>
          <li>人の生命・身体・財産の保護のために必要であり、本人の同意を得ることが困難な場合</li>
          <li>国または地方公共団体への協力が必要な場合</li>
        </ul>
        <p>
          なお、サービスの運営に必要な範囲で、業務委託先（クラウドサービス事業者等）に情報を提供する場合があります。その場合、適切な秘密保持契約を締結します。
        </p>
      </Section>

      <Section num="4" title="外部サービスの利用">
        <p>
          本サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーも併せてご確認ください。
        </p>
        <DataTable
          headers={['サービス名', '利用目的', '参照先']}
          rows={[
            ['Google OAuth', 'ログイン認証・アカウント情報の取得', 'Google プライバシーポリシー'],
            ['Supabase', 'データベース・認証基盤', 'Supabase プライバシーポリシー'],
            [
              'OpenAI / Anthropic等のLLM API',
              'メッセージ生成のためのAI処理',
              '各社プライバシーポリシー',
            ],
            ['Vercel', 'サービスのホスティング', 'Vercel プライバシーポリシー'],
          ]}
        />
      </Section>

      <Section num="5" title="Cookieおよびアクセス解析">
        <p>
          本サービスでは、サービスの利便性向上および利用状況の分析のためCookieを使用しています。ブラウザの設定によりCookieを無効にすることができますが、その場合一部の機能が利用できなくなる場合があります。
        </p>
        <p>
          また、サービス改善のためアクセス解析ツール（Google Analytics）を利用する場合があります。収集される情報は匿名化され、個人を特定するものではありません。
        </p>
      </Section>

      <Section num="6" title="情報の保存期間">
        <p>
          当社が取得した個人情報の保存期間は、特に定めを設けず、サービスの運営状況・法令上の義務・その他合理的な事情を考慮のうえ、当社の判断により適切に管理します。不要となった情報については、当社の判断により適時削除または匿名化処理を行います。なお、法令により一定期間の保存が義務付けられている情報については、当該期間に従って保管します。
        </p>
      </Section>

      <Section num="7" title="ユーザーの権利">
        <p>
          個人情報の取り扱いに関するご要望・ご質問は、下記のお問い合わせ窓口にてお受けします。内容を確認のうえ、当社が合理的と判断する範囲で対応いたします。なお、法令に基づく請求については、本人確認をさせていただいたうえで適切に対応します。
        </p>
      </Section>

      <Section num="8" title="未成年者の利用">
        <p>
          本サービスは18歳以上を対象としています。18歳未満の方のご利用はお断りしております。当社が18歳未満のユーザーの個人情報を取得したことが判明した場合、速やかに当該情報を削除します。
        </p>
      </Section>

      <Section num="9" title="安全管理措置">
        <p>
          当社は個人情報への不正アクセス・紛失・破壊・改ざん・漏えい等を防止するため、以下の措置を講じます。
        </p>
        <ul>
          <li>通信の暗号化（HTTPS/TLS）</li>
          <li>データベースへのアクセス制御</li>
          <li>従業者への個人情報保護教育</li>
          <li>定期的なセキュリティ見直し</li>
        </ul>
        <p>
          情報漏えい等が発生した場合は、速やかにユーザーへ通知するとともに、監督官庁への報告等、必要な措置を講じます。
        </p>
      </Section>

      <Section num="10" title="本ポリシーの変更">
        <p>
          当社は必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、サービス上での通知またはメールにてお知らせします。変更後も本サービスを継続してご利用いただいた場合、変更後のポリシーに同意したものとみなします。
        </p>
      </Section>

      <Section num="附" title="お問い合わせ窓口">
        <p>個人情報の取り扱いに関するご質問・ご要望は以下までご連絡ください。</p>
        <p>
          ●●●●株式会社　個人情報取扱窓口
          <br />
          メールアドレス：●●●@●●●.com
          <br />
          受付時間：平日 10:00〜18:00
        </p>
      </Section>
    </LegalLayout>
  )
}
