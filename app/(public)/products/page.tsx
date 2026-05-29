'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductFilter, FilterState } from '@/components/product-filter'
import { SearchBar } from '@/components/search-bar'
import { Pagination } from '@/components/pagination'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  rating: number
  images: string[]
  category: { name: string; id: string }
  supplier?: { name: string; id: string }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || undefined,
    supplier: searchParams.get('supplier') || undefined,
    minPrice: searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined,
    minRating: searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined,
  })

  // Fetch categories and suppliers
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catsRes, supsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/suppliers'),
        ])

        if (catsRes.ok) {
          const data = await catsRes.json()
          setCategories(data.categories || [])
        }
        if (supsRes.ok) {
          const data = await supsRes.json()
          setSuppliers(data.suppliers || [])
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error)
      }
    }

    fetchFilters()
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '12')
      params.set('sortBy', sortBy)

      const query = searchParams.get('search') || searchParams.get('q')
      if (query) params.set('q', query)
      if (filters.category) params.set('category', filters.category)
      if (filters.supplier) params.set('supplier', filters.supplier)
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
      if (filters.minRating) params.set('minRating', filters.minRating.toString())

      const response = await fetch(`/api/products/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, searchParams, sortBy])

  // Initial load and when filters change
  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Products</h1>
          <div className="max-w-2xl">
            <SearchBar placeholder="Search in products..." />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64">
            <ProductFilter
              categories={categories}
              suppliers={suppliers}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4 flex justify-between items-center">
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="w-full"
            >
              Filters
            </Button>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Sort Options */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-700">
                Showing {products.length > 0 ? (pagination.page - 1) * 12 + 1 : 0} -{' '}
                {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} products
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={product.price}
                      image={product.images?.[0]}
                      category={product.category?.name}
                      rating={product.rating}
                      supplier={product.supplier?.name}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) => fetchProducts(page)}
                    queryParams={{
                      ...filters,
                      sortBy,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found</p>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden mt-6 bg-white rounded-lg p-4">
            <ProductFilter
              categories={categories}
              suppliers={suppliers}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          </div>
        )}
      </div>
    </main>
  )
}
