import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  className?: string
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionTo,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-dashed border-gray-300 px-6 py-12 flex flex-col items-center text-center ${className}`}
    >
      <div className="bg-indigo-50 p-3 rounded-full mb-4">
        <Icon className="h-6 w-6 text-indigo-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export default EmptyState
