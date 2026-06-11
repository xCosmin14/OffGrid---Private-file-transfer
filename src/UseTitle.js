import { useEffect } from 'react'

export const useTitle = t => {
  useEffect(() => {document.title = t}, [t])
}