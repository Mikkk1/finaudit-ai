"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Edit2, Save, X, ChevronDown, ChevronRight } from "lucide-react"
import axios from "axios"

interface Metadata {
  [key: string]: string
}

interface Document {
  id: string
  title: string
  metadata: Metadata
}

interface MetadataPanelProps {
  document: Document
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ document }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMetadata, setEditedMetadata] = useState<Metadata>({})
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (document && document.metadata) {
      setEditedMetadata(document.metadata)
    } else {
      setEditedMetadata({})
    }
  }, [document])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.post(`http://127.0.0.1:8000/documents/${document.id}/metadata`, editedMetadata, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving metadata:", error)
      // Handle error (e.g., show error message to user)
    }
  }

  const handleCancel = () => {
    setEditedMetadata(document.metadata || {})
    setIsEditing(false)
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderComplexValue = (key: string, value: any, depth = 0) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection(key)}
            className="flex items-center text-navy-blue hover:text-soft-gold transition-colors"
          >
            {expandedSections[key] ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">View Details</span>
          </button>

          {expandedSections[key] && (
            <div className="ml-4 pl-4 border-l-2 border-light-border">
              {Object.entries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="py-2">
                  <span className="text-slate-gray font-medium">{nestedKey}:</span>
                  <div className="mt-1">{renderValue(nestedKey, nestedValue, depth + 1)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return renderValue(key, value, depth)
  }

  const renderValue = (key: string, value: any, depth = 0) => {
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-2 ml-4">
          {value.map((item, index) => (
            <li key={index} className="text-dark-text">
              {typeof item === "object" ? (
                <div className="bg-primary-bg/50 p-2 rounded-lg">
                  {Object.entries(item).map(([itemKey, itemValue]) => (
                    <div key={itemKey} className="mb-1">
                      <span className="text-slate-gray font-medium">{itemKey}:</span>{" "}
                      {renderValue(itemKey, itemValue, depth + 1)}
                    </div>
                  ))}
                </div>
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      )
    }
    return <span className="text-dark-text">{String(value)}</span>
  }

  if (!document || !document.metadata) {
    return <div>No metadata available</div>
  }

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Document Metadata</h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="bg-slate-gray/20 hover:bg-slate-gray/30 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#059669] to-[#047857] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Metadata
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6">
          {Object.entries(editedMetadata).map(([key, value]) => (
            <div
              key={key}
              className="group bg-primary-bg rounded-lg p-4 transition-all duration-200 hover:bg-hover-state"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <label htmlFor={key} className="text-sm font-medium text-slate-gray uppercase tracking-wide">
                    {key}
                  </label>
                </div>
                <div className="w-full">
                  {isEditing ? (
                    <textarea
                      id={key}
                      value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                      onChange={(e) => {
                        try {
                          const newValue = typeof value === "object" ? JSON.parse(e.target.value) : e.target.value
                          setEditedMetadata({
                            ...editedMetadata,
                            [key]: newValue,
                          })
                        } catch (error) {
                          // Handle invalid JSON input
                          setEditedMetadata({
                            ...editedMetadata,
                            [key]: e.target.value,
                          })
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-light-border bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 font-mono text-sm"
                      rows={typeof value === "object" ? 4 : 1}
                    />
                  ) : (
                    <div className="text-dark-text">{renderComplexValue(key, value)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MetadataPanel

