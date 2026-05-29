'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  baseUrl?: string
  queryParams?: Record<string, string | number>
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl = '/products',
  queryParams = {},
}: PaginationProps) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
    })
    return `${baseUrl}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7
    const halfWindow = Math.floor(maxVisible / 2)

    let startPage = Math.max(1, currentPage - halfWindow)
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) pages.push('...')
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      {/* Previous Button */}
      {currentPage > 1 ? (
        onPageChange ? (
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
        ) : (
          <Link href={getPageUrl(currentPage - 1)}>
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft size={16} />
              Previous
            </Button>
          </Link>
        )
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          <ChevronLeft size={16} />
          Previous
        </Button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            )
          }

          const pageNum = page as number
          return (
            <div key={pageNum}>
              {onPageChange ? (
                <Button
                  onClick={() => onPageChange(pageNum)}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-10"
                >
                  {pageNum}
                </Button>
              ) : (
                <Link href={getPageUrl(pageNum)}>
                  <Button
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-10"
                  >
                    {pageNum}
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        onPageChange ? (
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            Next
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Link href={getPageUrl(currentPage + 1)}>
            <Button variant="outline" size="sm" className="gap-1">
              Next
              <ChevronRight size={16} />
            </Button>
          </Link>
        )
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-1">
          Next
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  )
}
