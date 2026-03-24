import { useEffect, useRef } from 'react'
import { XMarkIcon } from '../Layout/Icons.jsx'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        if (open) dialogRef.current?.focus()
    }, [open])

    if (!open) return null

    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
                {/* Panel */}
                <div
                    ref={dialogRef}
                    tabIndex={-1}
                    className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-xl transform transition-all outline-none`}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="px-6 py-4">{children}</div>
                </div>
            </div>
        </div>
    )
}
