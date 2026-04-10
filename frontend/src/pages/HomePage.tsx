import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <Home className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Loxia</h1>
      </div>

      <p className="text-muted-foreground text-center max-w-md">
        Plateforme de location immobilière — en cours de construction.
      </p>

      <div className="flex gap-3">
        <Button disabled>Se connecter</Button>
        <Button variant="outline" disabled>
          S'inscrire
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Frontend skeleton — étapes suivantes : auth, catalog, candidatures.
      </p>
    </div>
  )
}

export default HomePage
