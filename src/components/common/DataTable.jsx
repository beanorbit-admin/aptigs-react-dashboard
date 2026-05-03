import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import Table from './Table'
import Pagination from './Pagination'

export default function DataTable({
  columns,
  data,
  total = 0,
  loading = false,
  searchPlaceholder = 'Search...',
  filterConfigs = [],
  pageSize = 10,
  actions,
  onQueryChange,
}) {
  const initialFilters = Object.fromEntries(filterConfigs.map(f => [f.key, 'All']))
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const queryRef = useRef({ search: '', filters: initialFilters, page: 1 })
  const searchTimer = useRef(null)

  useEffect(() => {
    onQueryChange?.(queryRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val) => {
    setSearch(val)
    setPage(1)
    queryRef.current = { ...queryRef.current, search: val, page: 1 }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onQueryChange?.(queryRef.current), 300)
  }

  const handleFilter = (key, val) => {
    const next = { ...filterValues, [key]: val }
    setFilterValues(next)
    setPage(1)
    queryRef.current = { search, filters: next, page: 1 }
    onQueryChange?.(queryRef.current)
  }

  const handlePage = (p) => {
    setPage(p)
    queryRef.current = { ...queryRef.current, page: p }
    onQueryChange?.(queryRef.current)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          {filterConfigs.map(f => (
            <select
              key={f.key}
              value={filterValues[f.key]}
              onChange={e => handleFilter(f.key, e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">{f.label}</option>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <Table columns={columns} data={data} />
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePage} />
    </div>
  )
}
