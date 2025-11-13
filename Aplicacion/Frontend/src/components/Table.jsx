import React from 'react'

const Table = ({ columns, data }) => (
  <table className="min-w-full border bg-white rounded shadow">
    <thead>
      <tr className="bg-gray-100">
        {columns.map((col) => (
          <th key={col} className="px-4 py-2 text-left">{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, idx) => (
        <tr key={idx} className="border-t">
          {Object.values(row).map((val, i) => (
            <td key={i} className="px-4 py-2">{val}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

export default Table
