'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { toast } from 'sonner'
import { usePaging } from '@/components/paging'

import { useSWRConfig } from 'swr'
import {
  fetcher,
  setQueryString,
  setMeta,
  getMetaValue,
  relativeUrl,
} from '@/lib/utils'
import { type PostAPI } from '@/types/api'
import { type Post } from '@/types/database'

interface QuickPublicProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  post: Post
}

const QuickPublic = ({ post, ...props }: QuickPublicProps) => {
  const { t } = useTranslation()
  const { mutate } = useSWRConfig()
  const paging = usePaging()

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  const onClick = async () => {
    try {
      setIsSubmitting(true)

      const future_date = getMetaValue(post?.meta, 'future_date')
      const now = new Date().toISOString()
      const data = {
        status: future_date ? 'future' : 'publish',
        meta: setMeta(post?.meta, 'visibility', 'public', {
          post_id: post?.id,
        }),
        user_id: post?.user_id,
      }

      const revalidatePaths = post?.permalink
        ? relativeUrl(post?.permalink)
        : null

      const { error } = await fetcher<PostAPI>(`/api/v1/post?id=${post?.id}`, {
        method: 'POST',
        body: JSON.stringify({
          data: post?.date ? data : { ...data, date: now },
          options: { revalidatePaths },
        }),
      })

      if (error) throw new Error(error?.message)

      const countSearchParams = setQueryString({
        userId: post?.user_id,
        postType: paging?.postType,
        q: paging?.q,
      })

      const listSearchParams = setQueryString({
        userId: post?.user_id,
        postType: paging?.postType,
        status: paging?.status,
        q: paging?.q,
        orderBy: paging?.orderBy,
        order: paging?.order,
        perPage: paging?.perPage,
        page: paging?.page,
      })

      mutate(`/api/v1/post?id=${post?.id}`)
      mutate(`/api/v1/post/count?${countSearchParams}`)
      mutate(`/api/v1/post/list?${listSearchParams}`)

      toast.success(t('changed_successfully'))
    } catch (e: unknown) {
      toast.error((e as Error)?.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      className="text-xs text-blue-700 hover:underline dark:text-white"
      onClick={onClick}
      disabled={isSubmitting}
      {...props}
    >
      {t('public')}
    </button>
  )
}

export { QuickPublic, type QuickPublicProps }
