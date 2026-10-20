import { Suspense } from 'react'
import { BoardersApp } from '@/components/boarders-app'

export default function UserPage() {
  return <Suspense><BoardersApp view="user" /></Suspense>
}
