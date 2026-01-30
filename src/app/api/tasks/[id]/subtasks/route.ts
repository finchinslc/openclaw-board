import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to safely broadcast
function broadcast(event: string, data: unknown) {
  if (typeof global.wsBroadcast === 'function') {
    global.wsBroadcast(event, data)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const subtasks = await prisma.subtask.findMany({
    where: { taskId: id },
    orderBy: { position: 'asc' },
  })
  
  return NextResponse.json(subtasks)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  // Get max position
  const maxPosition = await prisma.subtask.aggregate({
    where: { taskId: id },
    _max: { position: true },
  })
  
  const subtask = await prisma.subtask.create({
    data: {
      title: body.title,
      taskId: id,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  })
  
  // Fetch updated task for broadcast
  const task = await prisma.task.findUnique({
    where: { id },
    include: { 
      comments: { orderBy: { createdAt: 'asc' } },
      subtasks: { orderBy: { position: 'asc' } },
    },
  })
  
  broadcast('task:updated', task)
  
  return NextResponse.json(subtask, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { subtaskId, ...data } = body
  
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data,
  })
  
  // Fetch updated task for broadcast
  const task = await prisma.task.findUnique({
    where: { id },
    include: { 
      comments: { orderBy: { createdAt: 'asc' } },
      subtasks: { orderBy: { position: 'asc' } },
    },
  })
  
  broadcast('task:updated', task)
  
  return NextResponse.json(subtask)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const subtaskId = searchParams.get('subtaskId')
  
  if (!subtaskId) {
    return NextResponse.json({ error: 'subtaskId required' }, { status: 400 })
  }
  
  await prisma.subtask.delete({
    where: { id: subtaskId },
  })
  
  // Fetch updated task for broadcast
  const task = await prisma.task.findUnique({
    where: { id },
    include: { 
      comments: { orderBy: { createdAt: 'asc' } },
      subtasks: { orderBy: { position: 'asc' } },
    },
  })
  
  broadcast('task:updated', task)
  
  return NextResponse.json({ success: true })
}
