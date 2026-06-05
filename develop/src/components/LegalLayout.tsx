import { Link } from 'react-router-dom'

interface LegalLayoutProps {
  title: string
  meta: string
  children: React.ReactNode
  footerLink: { label: string; to: string }
}

export function SectionNum({ label }: { label: string }) {
  return (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand-light text-[12px] font-medium text-brand">
      {label}
    </span>
  )
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-r-md border-l-[3px] border-brand bg-brand-light py-[10px] pl-[14px] pr-3 text-[13px] leading-[1.7] text-brand-dark">
      {children}
    </div>
  )
}

export function Important({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-r-md border-l-[3px] border-warn-border bg-warn-bg py-[10px] pl-[14px] pr-3 text-[13px] leading-[1.7] text-warn-text">
      {children}
    </div>
  )
}

export function Section({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-black/10 px-6 py-6 last:border-none sm:px-8">
      <h2 className="mb-3 flex items-center gap-[10px] text-[16px] font-medium text-ink">
        <SectionNum label={num} />
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function LegalLayout({ title, meta, children, footerLink }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-page px-4 py-8 pb-16">
      <div className="mx-auto max-w-[680px]">
        {/* ヘッダー */}
        <div className="mb-6 rounded-lg border border-black/10 bg-white px-6 py-7 sm:px-8">
          <div className="mb-5 border-b border-black/10 pb-5">
            <img src="/images/lovenavi_logo_light.svg" alt="lovenavigation" className="h-7" />
          </div>
          <h1 className="mb-1.5 text-[22px] font-medium text-ink">{title}</h1>
          <p className="text-[13px] text-ink-tertiary">{meta}</p>
        </div>

        {/* 本文 */}
        <div className="mb-6 overflow-hidden rounded-lg border border-black/10 bg-white [&_li]:mb-1.5 [&_li]:text-[14px] [&_li]:leading-[1.7] [&_li]:text-ink-secondary [&_ol]:my-2 [&_ol]:pl-5 [&_p:last-child]:mb-0 [&_p]:mb-[10px] [&_p]:text-[14px] [&_p]:leading-[1.8] [&_p]:text-ink-secondary [&_ul]:my-2 [&_ul]:pl-5">
          {children}
        </div>

        {/* フッター */}
        <div className="text-center text-[12px] text-ink-tertiary">
          <span>© 2026 lovenavi</span>
          <span className="mx-2">|</span>
          <Link to={footerLink.to} className="text-brand hover:underline">
            {footerLink.label}
          </Link>
        </div>
      </div>
    </div>
  )
}
