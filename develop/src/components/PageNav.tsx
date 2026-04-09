import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  step?: string
  showBack?: boolean
  backPath?: string
}

const IconHome = () => (
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

const IconBack = () => (
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
)

export default function PageNav({ title, step, showBack = true, backPath }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-[10px] border-b border-black/10 px-4 py-[14px]">
      {showBack && (
        <button
          onClick={() => (backPath ? navigate(backPath) : navigate(-1))}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-transparent"
        >
          <IconBack />
        </button>
      )}
      <span className="flex-1 text-[15px] font-medium">{title}</span>
      {step && <span className="text-xs text-ink-tertiary">{step}</span>}
      <button
        onClick={() => navigate('/home')}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs text-ink-tertiary"
      >
        <IconHome />
        ホーム
      </button>
    </div>
  )
}
