import React from 'react'

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="text-red-500 font-bold hover:text-red-700">✖</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal
