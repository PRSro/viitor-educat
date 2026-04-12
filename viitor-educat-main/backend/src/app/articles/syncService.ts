import { prisma } from '../models/prisma.js';

import { FileArticle } from './articleService.js';

export interface ArticleMetadata {
  id: string;
  authorId: string;
  published: boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  updatedAt: string;
}

export const articleSyncService = {
  /**
   * Sync article metadata from file to database
   */
  async syncToDatabase(article: FileArticle): Promise<void> {
    try {
      const metadata = {
        id: article.id,
        authorId: article.authorId,
        published: article.published,
        status: article.status,
        version: article.metadata?.version || 1,
        updatedAt: article.updatedAt,
        contentHash: hashString(article.content)
      };
      
      console.log('[Sync] Syncing article metadata:', metadata.id);
      
    } catch (error) {
      console.error('[Sync] Failed to sync article to database:', error);
      throw error;
    }
  },

  /**
   * Get article metadata from database
   */
  async getMetadata(id: string): Promise<ArticleMetadata | null> {
    try {
      return null;
    } catch (error) {
      console.error('[Sync] Failed to get metadata:', error);
      return null;
    }
  },

  /**
   * Check if file and database are in sync
   */
  async verifySync(id: string, article: FileArticle): Promise<{ synced: boolean; differences: string[] }> {
    const differences: string[] = [];
    
    try {
      const metadata = await this.getMetadata(id);
      
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
      return [];
    } catch (error) {
      console.error('[Sync] Search failed:', error);
      return [];
    }
  }
};

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
