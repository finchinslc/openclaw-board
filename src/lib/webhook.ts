import crypto from 'crypto'

interface WebhookPayload {
  event: 'task.created' | 'task.updated' | 'task.status_changed' | 'task.deleted'
  timestamp: string
  task: {
    id: string
    taskNumber: number
    title: string
    description: string | null
    status: string
    priority: string
    origin: string
    tags: string[]
    isActive: boolean
    storyPoints: number | null
  }
  changes?: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
}

interface WebhookConfig {
  url: string
  secret?: string
  events?: string[] // Filter which events to send, empty = all
}

function getWebhookConfigs(): WebhookConfig[] {
  const configs: WebhookConfig[] = []
  
  // Primary webhook URL from env
  const primaryUrl = process.env.WEBHOOK_URL
  if (primaryUrl) {
    configs.push({
      url: primaryUrl,
      secret: process.env.WEBHOOK_SECRET,
      events: process.env.WEBHOOK_EVENTS?.split(',').map(e => e.trim()) || []
    })
  }
  
  // Support multiple webhooks via WEBHOOK_URL_1, WEBHOOK_URL_2, etc.
  for (let i = 1; i <= 5; i++) {
    const url = process.env[`WEBHOOK_URL_${i}`]
    if (url) {
      configs.push({
        url,
        secret: process.env[`WEBHOOK_SECRET_${i}`],
        events: process.env[`WEBHOOK_EVENTS_${i}`]?.split(',').map(e => e.trim()) || []
      })
    }
  }
  
  return configs
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function sendWebhook(
  event: WebhookPayload['event'],
  task: WebhookPayload['task'],
  changes?: WebhookPayload['changes']
): Promise<void> {
  const configs = getWebhookConfigs()
  
  if (configs.length === 0) {
    return // No webhooks configured
  }
  
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    task,
    ...(changes && { changes })
  }
  
  const body = JSON.stringify(payload)
  
  // Send to all configured webhooks (don't await, fire and forget)
  for (const config of configs) {
    // Check event filter
    if (config.events && config.events.length > 0 && !config.events.includes(event)) {
      continue
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OpenClaw-Event': event,
      'X-OpenClaw-Delivery': crypto.randomUUID()
    }
    
    // Add signature if secret is configured
    if (config.secret) {
      headers['X-OpenClaw-Signature'] = `sha256=${signPayload(body, config.secret)}`
    }
    
    // Fire and forget - don't block on webhook delivery
    fetch(config.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000) // 10s timeout
    }).catch(err => {
      console.error(`Webhook delivery failed to ${config.url}:`, err.message)
    })
  }
}

// Helper to extract minimal task data for webhook
export function taskToWebhookPayload(task: {
  id: string
  taskNumber: number
  title: string
  description: string | null
  status: string
  priority: string
  origin: string
  tags: string[]
  isActive: boolean
  storyPoints: number | null
}): WebhookPayload['task'] {
  return {
    id: task.id,
    taskNumber: task.taskNumber,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    origin: task.origin,
    tags: task.tags,
    isActive: task.isActive,
    storyPoints: task.storyPoints
  }
}
