import { router } from './trpc';
import { tasksRouter } from './routers/tasks';
import { slipsRouter } from './routers/slips';
import { budgetRouter } from './routers/budget';
import { proxyRouter } from './routers/proxy';
import { consensusRouter } from './routers/consensus';
import { flowsRouter } from './routers/flows';
import { aiRouter } from './routers/ai';
import { syncRouter } from './routers/sync';

export const appRouter = router({
  tasks: tasksRouter,
  slips: slipsRouter,
  budget: budgetRouter,
  proxy: proxyRouter,
  consensus: consensusRouter,
  flows: flowsRouter,
  ai: aiRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;