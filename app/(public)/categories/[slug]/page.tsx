'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {ProductCard} from '@/components/product-card';
import {ProductFilter} from '@/components/product-filter';
import {Pagination} from '@/components/pagination';
import { ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  images: string[];
  stock: number;
}

interface Category {
  name: string;
  description?: string;
  image?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    rating: 0,
    sortBy: 'name',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, [slug, filters, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: slug,
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString(),
        rating: filters.rating.toString(),
        sortBy: filters.sortBy,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/products/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        if (!category && data.category) {
          setCategory(data.category);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <a href="/" className="text-blue-600 hover:underline">
            Home
          </a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <a href="/products" className="text-blue-600 hover:underline">
            Products
          </a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">{category?.name || slug}</span>
        </div>
      </div>

      {/* Category Header */}
      {category && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 mt-2">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">{products.length} products found</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <ProductFilter filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
