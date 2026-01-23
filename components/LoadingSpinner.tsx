export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg', text?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className="flex items-center justify-center gap-2.5">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-current/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
      </div>
      {text && <span className="text-sm font-medium animate-pulse">{text}</span>}
    </div>
  )
}
