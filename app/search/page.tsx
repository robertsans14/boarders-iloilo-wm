import { Suspense } from 'react'
import { BoardersApp } from '@/components/boarders-app'

export default function SearchPage() {
  return <Suspense><BoardersApp view="explore" /></Suspense>
}
