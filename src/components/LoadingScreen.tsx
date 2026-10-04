export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-label="Cargando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss border-t-transparent" />
    </div>
  )
}
