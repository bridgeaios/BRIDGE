import { aiGateway } from './gateway';
import { getAllData } from '../db';

export interface RAGDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export class PersonalRAG {
  private documents: RAGDocument[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const data = await getAllData();
    this.documents = this.convertToDocuments(data);
    this.initialized = true;
  }

  private convertToDocuments(data: any): RAGDocument[] {
    const docs: RAGDocument[] = [];

    for (const task of data.tasks || []) {
      docs.push({
        id: `task-${task.id}`,
        content: `Task: ${task.title}. ${task.description || ''} Priority: ${task.priority}. Category: ${task.category}. ${task.completed ? 'Completed' : 'Pending'}.`,
        metadata: { type: 'task', ...task },
      });
    }

    for (const slip of data.slips || []) {
      docs.push({
        id: `slip-${slip.id}`,
        content: `Receipt from ${slip.merchant} for ${slip.currency} ${(slip.amountCents / 100).toFixed(2)} on ${slip.date}. Category: ${slip.category}. ${slip.description || ''}`,
        metadata: { type: 'slip', ...slip },
      });
    }

    for (const entry of data.ledger || []) {
      docs.push({
        id: `ledger-${entry.id}`,
        content: `Budget ${entry.type}: ${entry.title} for ${(entry.amountCents / 100).toFixed(2)} on ${entry.date}. Category: ${entry.categoryId}. ${entry.notes || ''}`,
        metadata: { type: 'ledger', ...entry },
      });
    }

    for (const proposal of data.proposals || []) {
      docs.push({
        id: `proposal-${proposal.id}`,
        content: `Consensus proposal: ${proposal.title}. ${proposal.description}. Status: ${proposal.status}. Rule: ${proposal.decisionRule}.`,
        metadata: { type: 'proposal', ...proposal },
      });
    }

    for (const flow of data.flows || []) {
      docs.push({
        id: `flow-${flow.id}`,
        content: `Workflow: ${flow.name}. ${flow.description}. Active: ${flow.isActive}. Blocks: ${flow.blocks?.length || 0}.`,
        metadata: { type: 'flow', ...flow },
      });
    }

    return docs;
  }

  async addDocument(doc: RAGDocument): Promise<void> {
    if (doc.embedding) {
      this.documents.push(doc);
    } else {
      const embedding = await aiGateway.generateEmbedding(doc.content);
      this.documents.push({ ...doc, embedding });
    }
  }

  async search(query: string, topK: number = 5): Promise<RAGDocument[]> {
    await this.initialize();

    const queryEmbedding = await aiGateway.generateEmbedding(query);

    const scored = this.documents
      .filter(d => d.embedding)
      .map(doc => ({
        doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(s => s.doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async generateContext(query: string, maxTokens: number = 2000): Promise<string> {
    const docs = await this.search(query, 10);
    let context = 'Relevant personal data:\n\n';
    let tokens = 0;

    for (const doc of docs) {
      const docTokens = Math.ceil(doc.content.length / 4);
      if (tokens + docTokens > maxTokens) break;
      context += `- ${doc.content}\n`;
      tokens += docTokens;
    }

    return context;
  }

  clear(): void {
    this.documents = [];
    this.initialized = false;
  }
}

export const personalRAG = new PersonalRAG();