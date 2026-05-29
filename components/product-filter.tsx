'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FilterSection {
  name: string
  options: { label: string; value: string; count?: number }[]
}

interface ProductFilterProps {
  categories?: { id: string; name: string; count?: number }[]
  suppliers?: { id: string; name: string; count?: number }[]
  onFilterChange: (filters: FilterState) => void
  loading?: boolean
}

export interface FilterState {
  category?: string
  supplier?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
}

export function ProductFilter({
  categories = [],
  suppliers = [],
  onFilterChange,
  loading = false,
}: ProductFilterProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    rating: true,
    supplier: true,
  })

  const [filters, setFilters] = useState<FilterState>({})
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...priceRange, [type]: value }
    setPriceRange(newRange)

    if (newRange.min > 0 || newRange.max < 10000) {
      handleFilterChange({
        ...filters,
        minPrice: newRange.min > 0 ? newRange.min : undefined,
        maxPrice: newRange.max < 10000 ? newRange.max : undefined,
      })
    }
  }

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...filters }
    if (filters.minRating === rating) {
      delete newFilters.minRating
    } else {
      newFilters.minRating = rating
    }
    handleFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setPriceRange({ min: 0, max: 10000 })
    onFilterChange({})
  }

  const FilterSectionComponent = ({
    title,
    section,
    children,
  }: {
    title: string
    section: string
    children: React.ReactNode
  }) => (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-blue-600"
      >
        {title}
        {expandedSections[section] ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>
      {expandedSections[section] && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-fit sticky top-20">
      {/* Clear Filters */}
      <Button
        onClick={clearFilters}
        variant="outline"
        className="w-full mb-4"
        disabled={Object.keys(filters).length === 0}
      >
        Clear Filters
      </Button>

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSectionComponent title="Categories" section="categories">
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.category === cat.id}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      category: e.target.checked ? cat.id : undefined,
                    })
                  }
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700">
                  {cat.name}
                  {cat.count && <span className="text-gray-500"> ({cat.count})</span>}
                </span>
              </label>
            ))}
          </div>
        </FilterSectionComponent>
      )}

      {/* Price Range */}
      <FilterSectionComponent title="Price Range" section="price">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Min: ${priceRange.min}
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Max: ${priceRange.max}
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </FilterSectionComponent>

      {/* Rating */}
      <FilterSectionComponent title="Rating" section="rating">
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.minRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="rounded border-gray-300 mr-2"
              />
              <span className="text-sm text-gray-700">
                {rating} star{rating > 1 ? 's' : ''} & up
              </span>
            </label>
          ))}
        </div>
      </FilterSectionComponent>

      {/* Suppliers */}
      {suppliers.length > 0 && (
        <FilterSectionComponent title="Suppliers" section="supplier">
          <div className="space-y-2">
            {suppliers.map((sup) => (
              <label key={sup.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.supplier === sup.id}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      supplier: e.target.checked ? sup.id : undefined,
                    })
                  }
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700">
                  {sup.name}
                  {sup.count && <span className="text-gray-500"> ({sup.count})</span>}
                </span>
              </label>
            ))}
          </div>
        </FilterSectionComponent>
      )}
    </div>
  )
}
