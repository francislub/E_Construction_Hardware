'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  debounceMs?: number
}

export function SearchBar({
  placeholder = 'Search products...',
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return

      setIsSearching(true)
      if (onSearch) {
        onSearch(searchQuery)
      } else {
        router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      }
      setIsSearching(false)
    },
    [router, onSearch]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isSearching}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
        <Button
          type="submit"
          size="icon"
          className="absolute right-1"
          disabled={isSearching}
        >
          <Search size={18} />
        </Button>
      </div>
    </form>
  )
}
