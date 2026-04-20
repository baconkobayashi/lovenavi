import { useNavigate } from 'react-router-dom'

type Tab = 'home' | 'history' | 'mypage'

interface Props {
  active: Tab
}

const IconHome = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke={active ? '#534AB7' : '#888780'}
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
  </svg>
)

const IconHistory = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke={active ? '#534AB7' : '#888780'}
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 6h12M4 10h8M4 14h5" />
  </svg>
)

const IconUser = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke={active ? '#534AB7' : '#888780'}
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="10" cy="7" r="3" />
    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
  </svg>
)

export default function BottomNav({ active }: Props) {
  const navigate = useNavigate()

  const items: { key: Tab; label: string; icon: React.ReactNode; path: string }[] = [
    { key: 'home', label: 'ホーム', icon: <IconHome active={active === 'home'} />, path: '/home' },
    {
      key: 'history',
      label: '履歴',
      icon: <IconHistory active={active === 'history'} />,
      path: '/history',
    },
    {
      key: 'mypage',
      label: 'マイページ',
      icon: <IconUser active={active === 'mypage'} />,
      path: '/mypage',
    },
  ]

  return (
    <div className="sticky bottom-0 z-40 flex justify-center">
      <div className="w-full max-w-[400px] border-t border-black/10 bg-white">
        <div className="flex">
          {items.map(({ key, label, icon, path }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent py-[10px]"
              >
                {icon}
                <span className={`text-[10px] ${isActive ? 'text-brand' : 'text-ink-tertiary'}`}>
                  {label}
                </span>
                <div
                  className={`h-1 w-1 rounded-full ${isActive ? 'bg-brand' : 'bg-transparent'}`}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
