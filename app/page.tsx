import VirtualOffice from '@/components/VirtualOffice'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <main className="h-screen w-screen overflow-hidden relative">
      <VirtualOffice />
    </main>
  )
}
