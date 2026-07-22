interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  { label: 'Create an invoice', message: 'Create a new invoice for a customer' },
  { label: 'Search products', message: 'Search for products in the catalog' },
  { label: 'View analytics', message: 'Show me the latest business analytics' },
  { label: 'Send an email', message: 'Send an email to a customer' },
  { label: 'Check inventory', message: 'Check current stock levels' },
  { label: 'Manage leads', message: 'Show me the current lead pipeline' },
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e65100]/10">
            <span className="text-2xl font-bold text-[#e65100]">BT</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-[#1a1a1a] dark:text-[#f5f0e8] mb-2">
          Bark Technologies Admin AI
        </h2>
        <p className="text-sm text-[#666] dark:text-[#999] mb-8">
          How can I help you manage your business today?
        </p>

        {/* Suggestion chips */}
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => onSuggestionClick(s.message)}
              className="rounded-xl border border-[#e5e0d6] dark:border-[#3d3a35] bg-white dark:bg-[#2a2a2a] px-4 py-3 text-left text-sm text-[#1a1a1a] dark:text-[#f5f0e8] hover:bg-[#f0ece0] dark:hover:bg-[#3d3a35] hover:border-[#e65100]/30 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
