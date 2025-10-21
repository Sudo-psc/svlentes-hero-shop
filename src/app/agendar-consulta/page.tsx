import Link from 'next/link'

export default function AgendarConsultaPage() {
  return (
    <div className="page-shell page-shell--muted page-shell--centered">
      <div className="page-shell-container page-shell-container--narrow">
        <div className="surface-panel surface-panel--accent text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">Agendar Consulta</h1>
            <p className="text-lg text-slate-600">
              Estamos realizando uma atualização rápida nesta área. Volte em breve ou fale com nossa equipe no WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:shadow-primary-500/40"
            >
              Voltar para a página inicial
            </Link>
            <a
              href="https://wa.me/5511947038078"
              className="inline-flex items-center justify-center rounded-full border border-primary/40 px-6 py-3 text-base font-semibold text-primary-700 transition hover:border-primary/70 hover:bg-primary/10"
            >
              Falar com especialista
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
