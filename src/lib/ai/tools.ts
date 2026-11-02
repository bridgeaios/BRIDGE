import { z } from 'zod';

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: z.ZodSchema;
  };
}

export const hubTools: AITool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in the To-Do hub',
      parameters: z.object({
        title: z.string().describe('Task title'),
        description: z.string().optional().describe('Task description'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        category: z.string().default('General'),
        dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'Get tasks from the To-Do hub',
      parameters: z.object({
        completed: z.boolean().optional().describe('Filter by completion status'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        category: z.string().optional(),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update an existing task',
      parameters: z.object({
        id: z.string().describe('Task ID'),
        title: z.string().optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_slip',
      description: 'Create a new receipt/slip capture',
      parameters: z.object({
        merchant: z.string().describe('Merchant name'),
        amountCents: z.number().describe('Amount in cents'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        category: z.string().default('Uncategorized'),
        currency: z.string().default('ZAR'),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_summary',
      description: 'Get budget summary with spending vs allocated',
      parameters: z.object({}),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_ledger_entry',
      description: 'Create a budget ledger entry',
      parameters: z.object({
        title: z.string(),
        type: z.enum(['expense', 'income', 'transfer']),
        amountCents: z.number(),
        date: z.string().describe('YYYY-MM-DD'),
        categoryId: z.string(),
        notes: z.string().optional(),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_proposal',
      description: 'Create a consensus proposal',
      parameters: z.object({
        title: z.string(),
        description: z.string(),
        deadline: z.string().describe('YYYY-MM-DD'),
        decisionRule: z.enum(['unanimous', 'consent', 'supermajority', 'majority']).default('consent'),
        minQuorumCount: z.number().default(1),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'vote_on_proposal',
      description: 'Vote on a consensus proposal',
      parameters: z.object({
        proposalId: z.string(),
        vote: z.enum(['agree', 'discuss', 'object', 'abstain']),
        objectionReason: z.string().optional(),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_flow',
      description: 'Execute a workflow flow',
      parameters: z.object({
        flowId: z.string(),
        context: z.record(z.any()).optional(),
      }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information',
      parameters: z.object({
        query: z.string(),
        numResults: z.number().default(5),
      }),
    },
  },
];

export async function executeToolCall(toolName: string, args: any): Promise<any> {
  const baseUrl = typeof window !== 'undefined' ? '' : `http://localhost:${process.env.PORT || 3000}`;

  try {
    const response = await fetch(`${baseUrl}/api/trpc/ai.executeTool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, args }),
    });
    return await response.json();
  } catch (error) {
    console.error('Tool execution failed:', error);
    return { success: false, error: 'Tool execution failed' };
  }
}

export function getToolSchemas() {
  return hubTools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
    },
  }));
}