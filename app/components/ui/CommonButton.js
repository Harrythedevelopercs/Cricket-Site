'use client'

import { useRouter } from 'next/navigation'
import { localizeUrl } from '../../lib/localizeUrl'

export default function CommonButton({ children, setRoutePath, className = '' }) {
  const router = useRouter()

  function handleClick() {
    router.push(localizeUrl(setRoutePath))
  }

  return (
    <div className={`mt-6 ${className}`}>
      <button
        onClick={handleClick}
        className="ccc-btn ccc-btn-primary text-[1.31rem] leading-[1.8rem] font-roboto-condensed font-bold px-8 py-2 rounded-full hover:scale-[1.05] transition-transform"
      >
        {children}
      </button>
    </div>
  )
}
