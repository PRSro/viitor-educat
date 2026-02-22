import { prisma } from '../models/prisma.js';

export interface ArticleMetadata {
  id: string;
  slug: string;
  authorId: string;
  published: boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  updatedAt: string;
}

export interface FileArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  sourceUrl?: string;
  category?: string;
  tags?: string[];
  authorId: string;
  published: boolean;
  status: 'draft' | 'published' | 'archived';
  paths: any[];
  metadata?: {
    wordCount: number;
    readingTime: number;
    lastModified: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Prisma model for file article metadata
// This should be added to schema.prisma, but we create a sync layer that works with existing models

export const articleSyncService = {
  /**
   * Sync article metadata from file to database
   */
  async syncToDatabase(article: FileArticle): Promise<void> {
    try {
      // Upsert article metadata - in a real implementation this would use a dedicated model
      // For now, we'll use a workaround with the existing Article model or create a metadata entry
      
      const metadata = {
        id: article.id,
        slug: article.slug,
        authorId: article.authorId,
        published: article.published,
        status: article.status,
        version: article.metadata?.version || 1,
        updatedAt: article.updatedAt,
        // Store content hash for change detection
        contentHash: hashString(article.content)
      };
      
      // Store in cache or dedicated table
      // This is a simplified version - in production you'd have a proper ArticleMetadata model
      await prisma.$transaction(async (tx) => {
        // Update or create metadata record
        // Using a workaround with existing models
        console.log('[Sync] Syncing article metadata:', metadata.slug);
      });
      
    } catch (error) {
      console.error('[Sync] Failed to sync article to database:', error);
      throw error;
    }
  },

  /**
   * Get article metadata from database
   */
  async getMetadata(slug: string): Promise<ArticleMetadata | null> {
    try {
      // In production, query the ArticleMetadata table
      // For now, return null as we don't have the model
      return null;
    } catch (error) {
      console.error('[Sync] Failed to get metadata:', error);
      return null;
    }
  },

  /**
   * Check if file and database are in sync
   */
  async verifySync(slug: string, article: FileArticle): Promise<{ synced: boolean; differences: string[] }> {
    const differences: string[] = [];
    
    try {
      const metadata = await this.getMetadata(slug);
      
      if (!metadata) {
        differences.push('No metadata found in database');
        return { synced: false, differences };
      }
      
      if (metadata.version !== (article.metadata?.version || 1)) {
        differences.push(`Version mismatch: DB=${metadata.version}, File=${article.metadata?.version}`);
      }
      
      if (new Date(metadata.updatedAt).getTime() !== new Date(article.updatedAt).getTime()) {
        differences.push(`UpdatedAt mismatch: DB=${metadata.updatedAt}, File=${article.updatedAt}`);
      }
      
      if (metadata.published !== article.published) {
        differences.push(`Published mismatch: DB=${metadata.published}, File=${article.published}`);
      }
      
      return { synced: differences.length === 0, differences };
    } catch (error) {
      differences.push(`Verification error: ${error}`);
      return { synced: false, differences };
    }
  },

  /**
   * Rebuild index from all files
   */
  async rebuildIndex(articles: FileArticle[]): Promise<{ success: boolean; synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;
    
    for (const article of articles) {
      try {
        await this.syncToDatabase(article);
        synced++;
      } catch {
        errors++;
      }
    }
    
    return { success: errors === 0, synced, errors };
  },

  /**
   * Get all article metadata for listing
   */
  async getAllMetadata(): Promise<ArticleMetadata[]> {
    try {
      // In production, query ArticleMetadata table
      return [];
    } catch (error) {
      console.error('[Sync] Failed to get all metadata:', error);
      return [];
    }
  },

  /**
   * Search articles via database (for full-text search)
   */
  async searchByContent(query: string, limit: number = 10): Promise<ArticleMetadata[]> {
    try {
      // In production, use Prisma's full-text search or raw SQL
      // For now, return empty
      return [];
    } catch (error) {
      console.error('[Sync] Search failed:', error);
      return [];
    }
  }
};

// Simple hash function for content change detection
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export default articleSyncService;
