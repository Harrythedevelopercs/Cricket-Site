import Image from 'next/image'
import Link from 'next/link'

export default function LogoContainer({ href, imageUrl, className = '', width }) {
  return (
    <Link
      href={href}
      className={`logo_container ${className}`.trim()}
      style={{ width }}
      aria-label="Club Cricket of Chicago home"
    >
      <Image
        src={`/images/${imageUrl}`}
        alt="Club Cricket of Chicago"
        width={160}
        height={80}
        priority
        className="w-full h-auto object-contain"
      />
    </Link>
  )
}
