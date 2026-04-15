import { Loader2 } from 'lucide-react'

interface LoaderProps {
  label?: string
  className?: string
}

function Loader({ label = 'Chargement…', className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-gray-500 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export default Loader
