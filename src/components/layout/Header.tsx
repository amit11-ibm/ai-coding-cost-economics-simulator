export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          $
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            AI Coding Cost Economics Simulator
          </h1>
          <p className="text-xs text-gray-500 leading-tight">
            24-month TCO comparison — all tools and pricing are fictional
          </p>
        </div>
      </div>
    </header>
  )
}
