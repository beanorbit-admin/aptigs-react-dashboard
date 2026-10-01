import { useMemo, useState } from 'react'
import { Search, X, UserCircle2 } from 'lucide-react'

// Checkbox list with search, built for long option lists (hundreds of items).
// options: [{ id, label, sublabel?, avatar?, showAvatar? }]
export default function SearchableMultiSelect({
  options, value, onChange, loading = false,
  searchPlaceholder = 'Search...', emptyText = 'No options available',
}) {
  const [search, setSearch] = useState('')

  const selectedSet = useMemo(() => new Set(value), [value])
  const byId = useMemo(() => new Map(options.map(o => [o.id, o])), [options])
  const selectedOptions = value.map(id => byId.get(id)).filter(Boolean)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => `${o.label} ${o.sublabel || ''}`.toLowerCase().includes(q))
  }, [options, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selectedSet.has(o.id))

  const toggle = (id) =>
    onChange(selectedSet.has(id) ? value.filter(v => v !== id) : [...value, id])

  const toggleAllFiltered = () => {
    const filteredIds = filtered.map(o => o.id)
    if (allFilteredSelected) {
      const remove = new Set(filteredIds)
      onChange(value.filter(v => !remove.has(v)))
    } else {
      onChange([...value, ...filteredIds.filter(id => !selectedSet.has(id))])
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-200 bg-gray-50 max-h-24 overflow-y-auto">
          {selectedOptions.map(o => (
            <span key={o.id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
              {o.label}
              <button type="button" onClick={() => toggle(o.id)} className="p-0.5 rounded-full hover:bg-indigo-200" title="Remove">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative border-b border-gray-200">
        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
        <span>{value.length} selected{search && ` · ${filtered.length} match${filtered.length === 1 ? '' : 'es'}`}</span>
        <div className="flex gap-3">
          {filtered.length > 0 && (
            <button type="button" onClick={toggleAllFiltered} className="text-indigo-600 hover:underline">
              {allFilteredSelected ? 'Deselect' : 'Select'} {search ? 'matches' : 'all'}
            </button>
          )}
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-gray-500 hover:underline">Clear</button>
          )}
        </div>
      </div>

      <ul className="max-h-56 overflow-y-auto">
        {loading ? (
          <li className="px-3 py-4 text-xs text-gray-400 text-center">Loading...</li>
        ) : filtered.length === 0 ? (
          <li className="px-3 py-4 text-xs text-gray-400 text-center">{search ? 'No matches' : emptyText}</li>
        ) : filtered.map(o => (
          <li key={o.id}>
            <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedSet.has(o.id)}
                onChange={() => toggle(o.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {o.showAvatar && (o.avatar
                ? <img src={o.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                : <UserCircle2 className="h-7 w-7 text-gray-300" />)}
              <span className="min-w-0">
                <span className="block text-sm text-gray-800 truncate">{o.label}</span>
                {o.sublabel && <span className="block text-xs text-gray-500 truncate">{o.sublabel}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
