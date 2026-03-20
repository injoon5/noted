import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"
import { SharePageClient } from "./share-page-client"

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params

  let page
  try {
    page = await fetchQuery(api.pages.getByShareToken, { shareToken: token })
  } catch {
    page = null
  }

  if (!page) {
    notFound()
  }

  return <SharePageClient page={page} />
}
