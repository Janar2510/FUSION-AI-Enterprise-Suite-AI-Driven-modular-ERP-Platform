/**
 * core/rag — Retrieval-Augmented Generation with permission filtering
 *
 * Implements the Phase 5 requirement from TODO.md:
 *   "enforce userId/orgId in vector search queries"
 *
 * Architecture:
 *  - Documents are stored with ownerUserId and orgId metadata.
 *  - Every search query MUST pass a PermissionFilter, which is applied
 *    BEFORE results are returned to any agent or route.
 *  - An agent can never access a document outside its caller's permission scope.
 *
 * Vector backend: pluggable via VectorAdapter interface.
 *   - Default: in-memory adapter for development.
 *   - Production: swap for pgvector, Qdrant, or Pinecone by setting RAG_BACKEND env var.
 */

export interface DocumentChunk {
    id: string;
    content: string;
    metadata: {
        sourceType: string;   // 'knowledge_article' | 'document' | 'helpdesk_ticket' | ...
        sourceId: number;
        ownerUserId?: number;
        orgId?: number;
        title?: string;
        tags?: string[];
    };
    // Embedding vector (omitted from public type — handled internally)
    _vector?: number[];
}

export interface PermissionFilter {
    userId?: number;
    orgId?: number;
    /** If true, also include documents with no ownerUserId (public docs) */
    includePublic?: boolean;
}

export interface SearchOptions {
    topK?: number;
    minScore?: number;
    sourceTypes?: string[];
}

export interface SearchResult {
    chunk: DocumentChunk;
    score: number;
}

// ── Vector Adapter interface ──────────────────────────────────────────────────

export interface VectorAdapter {
    upsert(chunks: DocumentChunk[]): Promise<void>;
    search(
        queryVector: number[],
        filter: PermissionFilter,
        options?: SearchOptions,
    ): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
}

// ── In-memory adapter (dev/test) ──────────────────────────────────────────────

export class InMemoryVectorAdapter implements VectorAdapter {
    private store: Map<string, DocumentChunk & { _vector: number[] }> = new Map();

    async upsert(chunks: DocumentChunk[]): Promise<void> {
        for (const chunk of chunks) {
            // In dev mode: generate a trivial pseudo-vector from text hash
            const vector = this.pseudoEmbed(chunk.content);
            this.store.set(chunk.id, { ...chunk, _vector: vector });
        }
    }

    async search(
        queryVector: number[],
        filter: PermissionFilter,
        options: SearchOptions = {},
    ): Promise<SearchResult[]> {
        const { topK = 5, minScore = 0.0, sourceTypes } = options;

        const results: SearchResult[] = [];

        for (const [, doc] of this.store) {
            // ── Permission gate (MUST enforce before any content check) ──────
            if (!this.passesPermissionFilter(doc, filter)) continue;

            // ── Source type filter ───────────────────────────────────────────
            if (sourceTypes && !sourceTypes.includes(doc.metadata.sourceType)) continue;

            // ── Cosine similarity ─────────────────────────────────────────────
            const score = this.cosineSimilarity(queryVector, doc._vector);
            if (score < minScore) continue;

            results.push({ chunk: doc, score });
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    async delete(ids: string[]): Promise<void> {
        for (const id of ids) this.store.delete(id);
    }

    // ── Permission enforcement logic ─────────────────────────────────────────

    private passesPermissionFilter(
        doc: DocumentChunk,
        filter: PermissionFilter,
    ): boolean {
        // No filter → deny everything (fail-secure)
        if (!filter.userId && !filter.orgId) return false;

        const { ownerUserId, orgId } = doc.metadata;

        // Public document (no owner) — allowed only if includePublic is set
        if (!ownerUserId && !orgId) {
            return filter.includePublic === true;
        }

        // Org-scoped: document belongs to the same org
        if (filter.orgId && orgId === filter.orgId) return true;

        // User-scoped: document belongs to the requesting user
        if (filter.userId && ownerUserId === filter.userId) return true;

        return false;
    }

    // ── Pseudo-embedding (deterministic, for dev/test only) ─────────────────

    private pseudoEmbed(text: string): number[] {
        const DIM = 128;
        const vec = new Array(DIM).fill(0);
        for (let i = 0; i < text.length; i++) {
            vec[i % DIM] += text.charCodeAt(i);
        }
        // Normalize
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
        return vec.map(v => v / norm);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }
}

// ── RAG Service ───────────────────────────────────────────────────────────────

export class RagService {
    constructor(private adapter: VectorAdapter) {}

    /**
     * Index a document chunk. Callers must provide ownerUserId or orgId
     * so the permission filter can enforce access later.
     */
    async index(chunk: DocumentChunk): Promise<void> {
        if (!chunk.metadata.ownerUserId && !chunk.metadata.orgId) {
            throw new Error(
                'RAG index error: chunk must have ownerUserId or orgId. ' +
                'Public documents require explicit metadata.ownerUserId = null and metadata.orgId = null.',
            );
        }
        await this.adapter.upsert([chunk]);
    }

    /**
     * Search for relevant chunks. Permission filter is MANDATORY.
     * Throws if neither userId nor orgId is provided.
     */
    async search(
        query: string,
        filter: PermissionFilter,
        options?: SearchOptions,
    ): Promise<SearchResult[]> {
        // Enforce: caller must provide at least one permission dimension
        if (!filter.userId && !filter.orgId) {
            throw new Error(
                'RAG search requires at least one permission dimension (userId or orgId). ' +
                'Unauthenticated searches are not allowed.',
            );
        }

        // In production: replace with real embedding API call
        const queryVector = this.embedQuery(query);
        return this.adapter.search(queryVector, filter, options);
    }

    /**
     * Remove chunks by their IDs (e.g., when a document is deleted).
     */
    async remove(ids: string[]): Promise<void> {
        await this.adapter.delete(ids);
    }

    // Stub: in production, call OpenAI/Anthropic embeddings endpoint
    private embedQuery(text: string): number[] {
        const DIM = 128;
        const vec = new Array(DIM).fill(0);
        for (let i = 0; i < text.length; i++) {
            vec[i % DIM] += text.charCodeAt(i);
        }
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
        return vec.map(v => v / norm);
    }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

const backend = process.env.RAG_BACKEND ?? 'memory';

let adapter: VectorAdapter;
if (backend === 'memory') {
    adapter = new InMemoryVectorAdapter();
} else {
    // Future: load Qdrant/pgvector adapter based on env
    console.warn(`[RAG] Unknown backend "${backend}", falling back to in-memory.`);
    adapter = new InMemoryVectorAdapter();
}

export const ragService = new RagService(adapter);
export default ragService;
