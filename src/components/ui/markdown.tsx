'use client'

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm prose-invert max-w-none',
        // Headings
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm',
        // Paragraphs
        'prose-p:text-muted-foreground prose-p:my-2',
        // Links
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Lists
        'prose-ul:my-2 prose-ol:my-2 prose-li:text-muted-foreground prose-li:my-0.5',
        // Code
        'prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
        'prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs',
        // Strong/emphasis
        'prose-strong:text-foreground prose-em:text-muted-foreground',
        className
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
