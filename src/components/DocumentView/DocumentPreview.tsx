"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { PDFSlick } from "@pdfslick/core"
import "@pdfslick/core/dist/pdf_viewer.css"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import { Spreadsheet } from "react-spreadsheet"
import axios from "axios"

interface DocumentPreviewProps {
  document: {
    id: number // Add document ID for fetching content
    file_type: string
    name: string
  }
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [documentContent, setDocumentContent] = useState<string | null>(null) // Store document content URL

  // Use a ref to store the PDFSlick instance
  const pdfSlickRef = useRef<PDFSlick | null>(null)

  // Fetch document content securely from the backend for all file types
  useEffect(() => {
    const fetchDocumentContent = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(
          `http://127.0.0.1:8000/documents/${document.id}/content`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "blob", // Fetch as a binary blob
          }
        )

        // Convert the blob to a URL
        const url = URL.createObjectURL(response.data)
        setDocumentContent(url)
      } catch (err) {
        console.error("Error fetching document content:", err)
      }
    }

    // Fetch content for all file types
    fetchDocumentContent()
  }, [document.id, document.file_type])

  // Initialize PDFSlick after the document content is fetched (only for PDFs)
  useEffect(() => {
    if (document.file_type === "application/pdf" && documentContent) {
      const container = document.getElementById("pdf-viewer")
      if (container) {
        // Initialize PDFSlick only if the container exists
        pdfSlickRef.current = new PDFSlick({
          container: "#pdf-viewer",
          documentUrl: documentContent, // Use the secure document content URL
        })

        // Clean up the PDFSlick instance when the component unmounts
        return () => {
          if (pdfSlickRef.current) {
            pdfSlickRef.current.destroy()
            pdfSlickRef.current = null
          }
        }
      }
    }
  }, [documentContent, document.file_type])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1))
  }

  const zoomIn = () => setScale((prevScale) => Math.min(2, prevScale + 0.1))
  const zoomOut = () => setScale((prevScale) => Math.max(0.5, prevScale - 0.1))

  const rotateClockwise = () => setRotation((prevRotation) => (prevRotation + 90) % 360)
  const rotateCounterClockwise = () => setRotation((prevRotation) => (prevRotation - 90 + 360) % 360)

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

  const renderPreview = () => {
    console.log("Document Type: ",document.file_type);
    switch (document.file_type) {
      case "application/pdf":
        return (
          <div id="pdf-viewer" className="w-full h-[600px]">
            {/* PDF Slick will render the PDF here */}
          </div>
        )
      case "image/jpeg":
      case "image/png":
      case "image/gif":
        return (
          <div className="flex items-center justify-center h-[600px]">
            <img
              src={documentContent || "/placeholder.svg"} // Use secure document content URL
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        return (
          <div className="h-[600px] overflow-auto">
            <Spreadsheet
              data={[
                [{ value: "Example" }, { value: "Spreadsheet" }],
                [{ value: "Data" }, { value: "Preview" }],
              ]}
            />
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
            <FileText size={64} />
            <p className="mt-4 text-lg">Preview not available for this file type</p>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col items-center bg-primary-bg rounded-xl shadow-lg p-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Document Container */}
      <div className="w-full bg-secondary-bg rounded-xl shadow-card p-6 mb-6 border border-light-border">
        {renderPreview()}
      </div>

      {/* Controls Container */}
      {document.file_type === "application/pdf" && (
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
                Page <span className="text-navy-blue">{pageNumber}</span> of{" "}
                <span className="text-navy-blue">{numPages}</span>
              </span>
              <ToolbarButton onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
                <ChevronRight size={20} />
              </ToolbarButton>
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="w-full max-w-md">
        <button
          onClick={() => window.open(documentContent || "#", "_blank")} // Use secure document content URL
          className="w-full px-6 py-3 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center shadow-lg group"
        >
          <Download
            className="mr-2 group-hover:transform group-hover:-translate-y-0.5 transition-transform"
            size={20}
          />
          Download Document
        </button>
      </div>
    </div>
  )
}

export default DocumentPreview