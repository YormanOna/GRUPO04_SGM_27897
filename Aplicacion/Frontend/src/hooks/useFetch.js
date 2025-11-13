import { useEffect, useState } from 'react'
import api from '../services/api'

export const useFetch = (url) => {
  const [data, setData] = useState([])
  useEffect(() => {
    api.get(url).then((res) => setData(res.data))
  }, [url])
  return data
}
