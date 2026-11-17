interface Props {
  src: string
  alt: string
  className?: string
  /** CSS object-position, used to keep the face inside the crop */
  position?: string
  variant?: 'arch' | 'print'
}

// Frames never stretch the image: object-cover with a face-aware object-position.
export default function Photo({ src, alt, className = '', position = '50% 30%', variant = 'arch' }: Props) {
  const outer = variant === 'arch' ? 'rounded-t-[999px] rounded-b-[1.25rem]' : 'rounded-[5px]'
  const inner = variant === 'arch' ? 'rounded-t-[999px] rounded-b-[0.9rem]' : 'rounded-[2px]'
  const inset = variant === 'arch' ? 'inset-[6px]' : 'inset-[10px]'
  return (
    <figure
      className={`relative m-0 border border-gold/70 bg-ivory/80 shadow-[0_30px_60px_-28px_rgba(64,30,48,.55)] ${outer} ${className}`}
    >
      <div className={`absolute ${inset} overflow-hidden ${inner}`}>
        <img
          src={src}
          alt={alt}
          decoding="async"
          draggable={false}
          className="h-full w-full select-none object-cover"
          style={{ objectPosition: position }}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(64,30,48,.12)]" />
      </div>
    </figure>
  )
}
