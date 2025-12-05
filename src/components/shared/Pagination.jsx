import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 p-3 md:p-4 border-t bg-gray-50">
      {/* Info Text */}
      <div className="text-xs md:text-sm text-gray-600">
        Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> items
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-1 md:p-2 rounded-lg border border-gray-300 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => handlePageClick(1)}
                className="px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-white transition"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="text-gray-400 px-1">...</span>
              )}
            </>
          )}

          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                page === currentPage
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {page}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="text-gray-400 px-1">...</span>
              )}
              <button
                onClick={() => handlePageClick(totalPages)}
                className="px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-white transition"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-1 md:p-2 rounded-lg border border-gray-300 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
