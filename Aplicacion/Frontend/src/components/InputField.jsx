import React from 'react'

const InputField = ({ label, type = 'text', value, onChange, name }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200"
    />
  </div>
)

export default InputField
