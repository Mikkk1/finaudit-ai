'use client'

import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface DocumentPreviewProps {
  document: {
    url: string
  }
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1))
  }

  const zoomIn = () => setScale(prevScale => Math.min(2, prevScale + 0.1))
  const zoomOut = () => setScale(prevScale => Math.max(0.5, prevScale - 0.1))

  const rotateClockwise = () => setRotation(prevRotation => (prevRotation + 90) % 360)
  const rotateCounterClockwise = () => setRotation(prevRotation => (prevRotation - 90 + 360) % 360)

  const enterFullScreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    }
  }

  const ToolbarButton = ({ onClick, disabled = false, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 text-slate-gray hover:text-navy-blue hover:bg-hover-state rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col items-center bg-primary-bg rounded-xl shadow-lg p-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Document Container */}
      <div className="w-full bg-secondary-bg rounded-xl shadow-card p-6 mb-6 border border-light-border">
        <Document
          file={document.url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-8 text-muted-text">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span>Loading PDF...</span>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto"
          />
        </Document>
      </div>

      {/* Controls Container */}
      <div className="w-full bg-secondary-bg rounded-xl p-4 mb-6 border border-light-border shadow-card">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Zoom and Rotate Controls */}
          <div className="flex items-center space-x-2">
            <ToolbarButton onClick={zoomOut}>
              <ZoomOut size={20} />
            </ToolbarButton>
            <span className="px-3 py-1 bg-primary-bg rounded-md text-dark-text min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <ToolbarButton onClick={zoomIn}>
              <ZoomIn size={20} />
            </ToolbarButton>
            <div className="w-px h-6 bg-light-border mx-2" />
            <ToolbarButton onClick={rotateCounterClockwise}>
              <RotateCcw size={20} />
            </ToolbarButton>
            <ToolbarButton onClick={rotateClockwise}>
              <RotateCw size={20} />
            </ToolbarButton>
            <ToolbarButton onClick={enterFullScreen}>
              <Maximize size={20} />
            </ToolbarButton>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-4">
            <ToolbarButton onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
              <ChevronLeft size={20} />
            </ToolbarButton>
            <span className="text-dark-text font-medium">
              Page <span className="text-navy-blue">{pageNumber}</span> of{' '}
              <span className="text-navy-blue">{numPages}</span>
            </span>
            <ToolbarButton onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
              <ChevronRight size={20} />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="w-full max-w-md">
        <button
          onClick={() => window.open(document.url, '_blank')}
          className="w-full px-6 py-3 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center shadow-lg group"
        >
          <Download className="mr-2 group-hover:transform group-hover:-translate-y-0.5 transition-transform" size={20} />
          Download Document
        </button>
      </div>
    </div>
  )
}

export default DocumentPreview