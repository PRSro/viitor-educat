import { prisma } from '../models/prisma.js';

const MAX_CONTENT_LENGTH = 2000;
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REPLIES_PER_MINUTE = 10;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (record.count >= MAX_REPLIES_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  return true;
}

function sanitizeHtml(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

export async function getComments(lessonId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { 
        lessonId,
        parentId: null,
        isDeleted: false
      },
      include: {
        author: {
          select: { id: true, email: true, role: true }
        },
        replies: {
          where: { isDeleted: false },
          include: {
            author: {
              select: { id: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    }),
    prisma.comment.count({
      where: { lessonId, parentId: null, isDeleted: false }
    })
  ]);

  return {
    comments: comments.map(c => ({
      id: c.id,
      content: c.content,
      authorId: c.authorId,
      author: {
        id: c.author.id,
        email: c.author.email,
        isTeacher: c.author.role === 'TEACHER' || c.author.role === 'ADMIN'
      },
      lessonId: c.lessonId,
      parentId: c.parentId,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
      isDeleted: c.isDeleted,
      replies: c.replies.map(r => ({
        id: r.id,
        content: r.content,
        authorId: r.authorId,
        author: {
          id: r.author.id,
          email: r.author.email,
          isTeacher: r.author.role === 'TEACHER' || r.author.role === 'ADMIN'
        },
        lessonId: r.lessonId,
        parentId: r.parentId,
        createdAt: r.createdAt,
        editedAt: r.editedAt,
        isDeleted: r.isDeleted
      }))
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function addComment(
  lessonId: string,
  authorId: string,
  content: string,
  parentId?: string
) {
  if (!checkRateLimit(authorId)) {
    throw new Error('Rate limit exceeded: max 10 comments per minute');
  }

  const sanitized = sanitizeHtml(content);
  if (sanitized.length === 0) {
    throw new Error('Comment content cannot be empty');
  }
  if (sanitized.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Comment cannot exceed ${MAX_CONTENT_LENGTH} characters`);
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId }
    });
    if (!parent || parent.lessonId !== lessonId) {
      throw new Error('Invalid parent comment');
    }
    if (parent.parentId) {
      throw new Error('Replies cannot be nested further');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: sanitized,
      authorId,
      lessonId,
      parentId
    },
    include: {
      author: {
        select: { id: true, email: true, role: true }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: authorId,
      action: 'CREATE_COMMENT',
      resource: 'comment',
      resourceId: comment.id,
      metadata: { lessonId, parentId: parentId || null }
    }
  });

  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    author: {
      id: comment.author.id,
      email: comment.author.email,
      isTeacher: comment.author.role === 'TEACHER' || comment.author.role === 'ADMIN'
    },
    lessonId: comment.lessonId,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    isDeleted: comment.isDeleted
  };
}

export async function editComment(commentId: string, authorId: string, newContent: string) {
  const sanitized = sanitizeHtml(newContent);
  if (sanitized.length === 0) {
    throw new Error('Comment content cannot be empty');
  }
  if (sanitized.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Comment cannot exceed ${MAX_CONTENT_LENGTH} characters`);
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== authorId) {
    throw new Error('You can only edit your own comments');
  }

  const editWindowEnd = new Date(comment.createdAt.getTime() + EDIT_WINDOW_MS);
  if (new Date() > editWindowEnd) {
    throw new Error('Edit window has expired (15 minutes)');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: sanitized },
    include: {
      author: {
        select: { id: true, email: true, role: true }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: authorId,
      action: 'EDIT_COMMENT',
      resource: 'comment',
      resourceId: commentId,
      metadata: { lessonId: comment.lessonId }
    }
  });

  return {
    id: updated.id,
    content: updated.content,
    authorId: updated.authorId,
    author: {
      id: updated.author.id,
      email: updated.author.email,
      isTeacher: updated.author.role === 'TEACHER' || updated.author.role === 'ADMIN'
    },
    lessonId: updated.lessonId,
    parentId: updated.parentId,
    createdAt: updated.createdAt,
    editedAt: updated.editedAt,
    isDeleted: updated.isDeleted
  };
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  const isOwner = comment.authorId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new Error('You can only delete your own comments');
  }

  if (isAdmin && !isOwner) {
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, content: '[deleted]' }
    });
  } else {
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, content: '[deleted]' }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: isAdmin && !isOwner ? 'ADMIN_DELETE_COMMENT' : 'DELETE_COMMENT',
      resource: 'comment',
      resourceId: commentId,
      metadata: { lessonId: comment.lessonId, isOwner, isAdmin }
    }
  });

  return { success: true };
}
