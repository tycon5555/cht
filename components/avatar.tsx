import Image from 'next/image'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function Avatar({ src, alt = 'Avatar', size = 'md', online }: AvatarProps) {
  return (
    <div className={`relative ${sizeMap[size]}`}>
      <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-full overflow-hidden">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground font-semibold text-sm">
            {alt.charAt(0)}
          </div>
        )}
      </div>
      {online !== undefined && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${online ? 'bg-green-500' : 'bg-muted'}`} />
      )}
    </div>
  )
}
