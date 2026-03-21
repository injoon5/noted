"use client"

import { Editor } from "@/components/editor/editor"
import { PageHeader } from "@/components/page/page-header"

interface Page {
  title: string
  content: string
  icon?: string
  coverImage?: string
  updatedAt: number
}

interface SharePageClientProps {
  page: Page
}

export function SharePageClient({ page }: SharePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl pb-24">
        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Shared via Noted</div>
          <div className="text-xs text-muted-foreground">Read only</div>
        </div>

        <PageHeader
          page={{ _id: "", title: page.title, icon: page.icon, coverImage: page.coverImage, updatedAt: page.updatedAt }}
          onUpdate={() => {}}
          editable={false}
        />

        <div className="px-8 mt-2">
          <Editor content={page.content} editable={false} />
        </div>
      </div>
    </div>
  )
}
