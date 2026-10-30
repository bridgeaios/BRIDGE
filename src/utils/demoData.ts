/**
 * Realistic Demo Data for Big Button Life Hub
 * Pre-populated with 5 tasks, 3 receipts, full monthly budget, 2 proxies, 3 proposals, 2 flows.
 * All monetary amounts stored as integer cents (ZAR).
 */

import { AppDatabase, UserPersona } from '../types';

export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: 'user_owner',
    name: 'You (Hub Admin)',
    email: 'ryanpcowan@gmail.com',
    role: 'owner',
    avatar: '👑',
    color: 'bg-amber-400',
  },
  {
    id: 'user_sarah',
    name: 'Sarah Mthembu',
    email: 'sarah.m@tinkererhub.za',
    role: 'proxy',
    avatar: '⚡',
    color: 'bg-purple-400',
  },
  {
    id: 'user_alex',
    name: 'Alex Van Der Merwe',
    email: 'alex.vdm@tinkererhub.za',
    role: 'proxy',
    avatar: '🛠️',
    color: 'bg-blue-400',
  },
  {
    id: 'user_sipho',
    name: 'Sipho Ndlovu',
    email: 'sipho.n@tinkererhub.za',
    role: 'member',
    avatar: '🌱',
    color: 'bg-emerald-400',
  },
];

export function getInitialDemoDatabase(): AppDatabase {
  const today = '2026-10-30';

  return {
    version: 1,
    currentCurrency: 'ZAR',
    adminConfig: {
      adminPin: '1234',
      defaultCurrency: 'ZAR',
      defaultWhatsAppPhone: '+27821234567',
      enableAutoCalendarSync: false,
      enableAutoSheetSync: false,
      aiPersonality: 'buddy',
      isEmergencyFrozen: false,
    },
    tasks: [
      {
        id: 'task-1',
        title: 'Assemble solar charge controller for off-grid rig',
        description: 'Verify MPPT 60A cabling, crimp Anderson connectors, test battery terminal voltage.',
        completed: false,
        dueDate: today,
        priority: 'urgent',
        category: 'Hardware',
        subtasks: [
          { id: 'st-1', title: 'Check MC4 crimps', completed: true },
          { id: 'st-2', title: 'Torque terminal screws to 3.5Nm', completed: true },
          { id: 'st-3', title: 'Verify Bluetooth telemetry handshake', completed: false },
        ],
        recurring: 'none',
        createdAt: '2026-10-28T09:00:00Z',
      },
      {
        id: 'task-2',
        title: 'Reconcile Makerspace hardware slips with ledger',
        description: 'Match Takealot and Builders Warehouse receipts with allocated budget.',
        completed: false,
        dueDate: '2026-10-31',
        priority: 'high',
        category: 'Finance',
        subtasks: [
          { id: 'st-4', title: 'Scan takealot invoice', completed: true },
          { id: 'st-5', title: 'Verify VAT breakdown (15%)', completed: false },
        ],
        recurring: 'weekly',
        linkedBudgetId: 'cat-gear',
        linkedSlipId: 'slip-1',
        createdAt: '2026-10-27T11:00:00Z',
      },
      {
        id: 'task-3',
        title: 'Review Q4 Tooling & Filament Budget allocations',
        description: 'Check expenditure run-rate before November prototype cycle.',
        completed: false,
        dueDate: '2026-11-03',
        priority: 'medium',
        category: 'Finance',
        subtasks: [],
        recurring: 'monthly',
        assignedProxyId: 'proxy-1',
        linkedBudgetId: 'cat-gear',
        createdAt: '2026-10-26T14:30:00Z',
      },
      {
        id: 'task-4',
        title: 'Vote on Community Laser Cutter Acquisition proposal',
        description: 'Consensus deadline approaching! Cast vote and verify ventilation safety note.',
        completed: false,
        dueDate: '2026-11-02',
        priority: 'urgent',
        category: 'Governance',
        subtasks: [
          { id: 'st-6', title: 'Read ventilation specs', completed: true },
          { id: 'st-7', title: 'Submit Agree / Discuss vote', completed: false },
        ],
        recurring: 'none',
        linkedProposalId: 'prop-1',
        createdAt: '2026-10-29T08:15:00Z',
      },
      {
        id: 'task-5',
        title: 'Weekly workshop safety & battery bank check',
        description: 'Measure LiFePO4 cell delta-voltage and inspect fire extinguishers.',
        completed: true,
        dueDate: today,
        priority: 'low',
        category: 'Safety',
        subtasks: [
          { id: 'st-8', title: 'Log cell balance readings', completed: true },
          { id: 'st-9', title: 'Test emergency stop contactors', completed: true },
        ],
        recurring: 'weekly',
        createdAt: '2026-10-25T16:00:00Z',
        completedAt: '2026-10-30T07:10:00Z',
      },
    ],

    slips: [
      {
        id: 'slip-1',
        merchant: 'Builders Warehouse Cape Town',
        date: '2026-10-28',
        amountCents: 48990, // R 489.90
        taxCents: 6390, // R 63.90 VAT
        currency: 'ZAR',
        category: 'Tinkering & Gear',
        description: 'M4 brass standoffs, heatshrink tubing, silicone wire',
        documentDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23fff" stroke="%23333" stroke-width="4"/><text x="20" y="50" font-family="monospace" font-weight="bold" font-size="16">BUILDERS WAREHOUSE</text><text x="20" y="80" font-family="monospace" font-size="12">DATE: 2026-10-28</text><text x="20" y="110" font-family="monospace" font-size="12">1x BRASS STANDOFFS  R189.90</text><text x="20" y="130" font-family="monospace" font-size="12">1x SILICONE WIRE 12AWG R300.00</text><line x1="20" y1="160" x2="280" y2="160" stroke="%23000" stroke-dasharray="4"/><text x="20" y="190" font-family="monospace" font-weight="bold" font-size="16">TOTAL: R 489.90</text><text x="20" y="215" font-family="monospace" font-size="11">INCL 15% VAT: R 63.90</text><text x="20" y="270" font-family="monospace" font-size="10">AUTH: 883921 [APPROVED]</text></svg>',
        documentType: 'image',
        fileHash: 'hash-builders-20261028-48990',
        isDuplicate: false,
        linkedBudgetId: 'cat-gear',
        createdAt: '2026-10-28T14:22:00Z',
        extractedViaOcr: true,
        syncedToLedger: true,
      },
      {
        id: 'slip-2',
        merchant: 'Woolworths Food - Kloof Street',
        date: '2026-10-29',
        amountCents: 34250, // R 342.50
        taxCents: 4467,
        currency: 'ZAR',
        category: 'Food & Groceries',
        description: 'Team coffee beans, oat milk, sourdough, fresh fruit',
        documentDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23fff" stroke="%23333" stroke-width="4"/><text x="20" y="50" font-family="monospace" font-weight="bold" font-size="16">WOOLWORTHS FOOD</text><text x="20" y="80" font-family="monospace" font-size="12">DATE: 2026-10-29</text><text x="20" y="110" font-family="monospace" font-size="12">COFFEE BEANS 1KG   R199.99</text><text x="20" y="130" font-family="monospace" font-size="12">OAT MILK x2        R 89.98</text><text x="20" y="150" font-family="monospace" font-size="12">FRUIT &amp; BREAD      R 52.53</text><line x1="20" y1="180" x2="280" y2="180" stroke="%23000" stroke-dasharray="4"/><text x="20" y="210" font-family="monospace" font-weight="bold" font-size="16">TOTAL: R 342.50</text></svg>',
        documentType: 'image',
        fileHash: 'hash-woolies-20261029-34250',
        isDuplicate: false,
        linkedBudgetId: 'cat-food',
        createdAt: '2026-10-29T10:05:00Z',
        extractedViaOcr: true,
        syncedToLedger: true,
      },
      {
        id: 'slip-3',
        merchant: 'Takealot Online',
        date: '2026-10-26',
        amountCents: 129900, // R 1,299.00
        taxCents: 16943,
        currency: 'ZAR',
        category: 'Tinkering & Gear',
        description: 'Raspberry Pi 5 8GB board with active cooler & power supply',
        documentDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23fff" stroke="%23333" stroke-width="4"/><text x="20" y="50" font-family="monospace" font-weight="bold" font-size="16">TAKEALOT.COM INVOICE</text><text x="20" y="80" font-family="monospace" font-size="12">ORDER: %23TAK-992019-ZA</text><text x="20" y="110" font-family="monospace" font-size="12">RASPBERRY PI 5 8GB R1,299.00</text><line x1="20" y1="150" x2="280" y2="150" stroke="%23000" stroke-dasharray="4"/><text x="20" y="180" font-family="monospace" font-weight="bold" font-size="16">PAID: R 1,299.00</text><text x="20" y="210" font-family="monospace" font-size="11">TAX INVOICE: ZA-4991028</text></svg>',
        documentType: 'image',
        fileHash: 'hash-takealot-20261026-129900',
        isDuplicate: false,
        linkedBudgetId: 'cat-gear',
        createdAt: '2026-10-26T17:15:00Z',
        extractedViaOcr: true,
        syncedToLedger: true,
      },
    ],

    budgetCategories: [
      {
        id: 'cat-gear',
        name: 'Tinkering & Gear',
        allocatedCents: 450000, // R 4,500.00
        spendingLimitCents: 500000, // R 5,000.00 limit
        icon: '🛠️',
        color: '#14B8A6',
      },
      {
        id: 'cat-food',
        name: 'Food & Groceries',
        allocatedCents: 550000, // R 5,500.00
        spendingLimitCents: 600000,
        icon: '🥑',
        color: '#10B981',
      },
      {
        id: 'cat-power',
        name: 'Utilities & Power',
        allocatedCents: 220000, // R 2,200.00
        spendingLimitCents: 250000,
        icon: '⚡',
        color: '#F59E0B',
      },
      {
        id: 'cat-transport',
        name: 'Transport & Fuel',
        allocatedCents: 180000, // R 1,800.00
        spendingLimitCents: 200000,
        icon: '🚗',
        color: '#3B82F6',
      },
      {
        id: 'cat-reserve',
        name: 'Emergency Reserve',
        allocatedCents: 300000, // R 3,000.00
        spendingLimitCents: 300000,
        icon: '🛡️',
        color: '#8B5CF6',
      },
    ],

    ledger: [
      {
        id: 'led-1',
        title: 'Monthly Engineering Consulting Income',
        type: 'income',
        amountCents: 2800000, // R 28,000.00
        date: '2026-10-25',
        categoryId: 'cat-reserve',
        source: 'manual',
        notes: 'Monthly retainer payout from Client Labs',
        createdByUserId: 'user_owner',
        createdAt: '2026-10-25T08:00:00Z',
      },
      {
        id: 'led-2',
        title: 'Builders Warehouse Cape Town',
        type: 'expense',
        amountCents: 48990, // R 489.90
        date: '2026-10-28',
        categoryId: 'cat-gear',
        slipId: 'slip-1',
        source: 'slip_ocr',
        notes: 'Brass standoffs & wiring for solar project',
        createdByUserId: 'user_owner',
        createdAt: '2026-10-28T14:25:00Z',
      },
      {
        id: 'led-3',
        title: 'Woolworths Food - Kloof Street',
        type: 'expense',
        amountCents: 34250, // R 342.50
        date: '2026-10-29',
        categoryId: 'cat-food',
        slipId: 'slip-2',
        source: 'slip_ocr',
        notes: 'Coffee beans & snacks for hackathon sprint',
        createdByUserId: 'user_owner',
        createdAt: '2026-10-29T10:10:00Z',
      },
      {
        id: 'led-4',
        title: 'Takealot Online - Raspberry Pi 5',
        type: 'expense',
        amountCents: 129900, // R 1,299.00
        date: '2026-10-26',
        categoryId: 'cat-gear',
        slipId: 'slip-3',
        source: 'slip_ocr',
        notes: 'Server upgrade controller',
        createdByUserId: 'user_owner',
        createdAt: '2026-10-26T17:20:00Z',
      },
      {
        id: 'led-5',
        title: 'Municipal Pre-Paid Power Recharge',
        type: 'expense',
        amountCents: 95000, // R 950.00
        date: '2026-10-27',
        categoryId: 'cat-power',
        source: 'manual',
        notes: 'Eskom/City Power token 350kWh',
        createdByUserId: 'user_owner',
        createdAt: '2026-10-27T09:00:00Z',
      },
    ],

    recurringBills: [
      {
        id: 'rec-1',
        name: 'Workshop Gigabit Fiber (Openserve/Cool Ideas)',
        amountCents: 89900, // R 899.00
        frequency: 'monthly',
        dueDay: 1,
        categoryId: 'cat-power',
        isAutoPaid: true,
      },
      {
        id: 'rec-2',
        name: 'Vehicle Comprehensive Insurance',
        amountCents: 75000, // R 750.00
        frequency: 'monthly',
        dueDay: 15,
        categoryId: 'cat-transport',
        isAutoPaid: true,
      },
    ],

    savingsGoals: [
      {
        id: 'goal-1',
        title: 'Workshop CNC Router',
        targetCents: 1800000, // R 18,000.00
        currentCents: 1150000, // R 11,500.00
        targetDate: '2026-12-15',
        icon: '🎛️',
      },
      {
        id: 'goal-2',
        title: 'Backup LiFePO4 5kWh Battery',
        targetCents: 2200000, // R 22,000.00
        currentCents: 1600000, // R 16,000.00
        targetDate: '2027-02-01',
        icon: '🔋',
      },
    ],

    proxies: [
      {
        id: 'proxy-1',
        grantorId: 'user_owner',
        granteeId: 'user_sarah',
        granteeName: 'Sarah Mthembu',
        granteeEmail: 'sarah.m@tinkererhub.za',
        status: 'active',
        permissions: ['view_tasks', 'edit_tasks', 'submit_expenses', 'review_budgets', 'approve_expenses'],
        approvalCeilingCents: 250000, // R 2,500.00 max approval authority
        startDate: '2026-10-01',
        expirationDate: '2026-12-31',
        createdAt: '2026-10-01T08:00:00Z',
      },
      {
        id: 'proxy-2',
        grantorId: 'user_owner',
        granteeId: 'user_alex',
        granteeName: 'Alex Van Der Merwe',
        granteeEmail: 'alex.vdm@tinkererhub.za',
        status: 'pending',
        permissions: ['view_tasks', 'submit_expenses', 'submit_consensus', 'cast_vote'],
        approvalCeilingCents: 500000, // R 5,000.00
        startDate: '2026-10-15',
        expirationDate: '2026-11-30',
        createdAt: '2026-10-15T10:00:00Z',
      },
    ],

    proxyAuditLogs: [
      {
        id: 'aud-1',
        proxyId: 'proxy-1',
        action: 'approve_expenses',
        details: 'Approved expense slip R 489.90 (Builders Warehouse) - within ceiling R 2,500.00',
        timestamp: '2026-10-28T14:30:00Z',
        authorized: true,
      },
      {
        id: 'aud-2',
        proxyId: 'proxy-2',
        action: 'attempt_high_approval',
        details: 'Attempted to approve R 6,200 generator repair - rejected by server (exceeds R 5,000 ceiling)',
        timestamp: '2026-10-27T16:45:00Z',
        authorized: false,
        reason: 'Requested amount R 6,200.00 exceeds authorized ceiling of R 5,000.00',
      },
    ],

    proposals: [
      {
        id: 'prop-1',
        title: 'Acquire 60W CO2 Laser Cutter for the Shared Lab',
        description: 'Purchase a calibrated 600x400mm CO2 laser cutter with dedicated fume extraction for acrylic enclosures and custom wooden jigs. Budget impact: R 14,500 from Tinkering reserve.',
        ownerId: 'user_owner',
        ownerName: 'You (Hub Admin)',
        deadline: '2026-11-02',
        decisionRule: 'consent',
        minQuorumCount: 3,
        eligibleVoterIds: ['user_owner', 'user_sarah', 'user_alex', 'user_sipho'],
        votes: {
          user_owner: {
            userId: 'user_owner',
            userName: 'You (Hub Admin)',
            vote: 'agree',
            votedAt: '2026-10-29T09:00:00Z',
          },
          user_sarah: {
            userId: 'user_sarah',
            userName: 'Sarah Mthembu',
            vote: 'agree',
            votedAt: '2026-10-29T11:20:00Z',
          },
          user_alex: {
            userId: 'user_alex',
            userName: 'Alex Van Der Merwe',
            vote: 'discuss',
            objectionReason: 'Need to ensure ventilation exhaust vents outdoors away from window intake.',
            votedAt: '2026-10-29T15:10:00Z',
          },
        },
        comments: [
          {
            id: 'c-1',
            userId: 'user_alex',
            userName: 'Alex Van Der Merwe',
            text: 'I strongly recommend an active charcoal canister filter alongside the inline duct fan.',
            createdAt: '2026-10-29T15:11:00Z',
          },
          {
            id: 'c-2',
            userId: 'user_owner',
            userName: 'You (Hub Admin)',
            text: 'Agreed! Added R 600 line item for carbon canister and 100mm flexible aluminum ducting.',
            createdAt: '2026-10-29T16:00:00Z',
          },
        ],
        status: 'open',
        resolvedObjections: ['ventilation_filter_addressed'],
        resultingActionItemIds: [],
        createdAt: '2026-10-29T08:00:00Z',
      },
      {
        id: 'prop-2',
        title: 'Adjust Monthly Workshop Fuel & Generator Allowance to R 1,200',
        description: 'With scheduled power outages in summer maintenance, raise fuel allowance from R 800 to R 1,200 monthly to ensure battery backup charge continuity.',
        ownerId: 'user_sarah',
        ownerName: 'Sarah Mthembu',
        deadline: '2026-11-05',
        decisionRule: 'majority',
        minQuorumCount: 2,
        eligibleVoterIds: ['user_owner', 'user_sarah', 'user_alex'],
        votes: {
          user_sarah: {
            userId: 'user_sarah',
            userName: 'Sarah Mthembu',
            vote: 'agree',
            votedAt: '2026-10-28T10:00:00Z',
          },
        },
        comments: [],
        status: 'open',
        resolvedObjections: [],
        createdAt: '2026-10-28T09:30:00Z',
      },
      {
        id: 'prop-3',
        title: 'Solar Panel Expansion on Workshop Roof (12x 550W Panels)',
        description: 'Complete transition to full solar daytime microgrid by mounting 12 Tier-1 mono bifacial panels.',
        ownerId: 'user_owner',
        ownerName: 'You (Hub Admin)',
        deadline: '2026-10-20',
        decisionRule: 'supermajority',
        minQuorumCount: 3,
        eligibleVoterIds: ['user_owner', 'user_sarah', 'user_alex', 'user_sipho'],
        votes: {
          user_owner: { userId: 'user_owner', userName: 'You (Hub Admin)', vote: 'agree', votedAt: '2026-10-18T10:00:00Z' },
          user_sarah: { userId: 'user_sarah', userName: 'Sarah Mthembu', vote: 'agree', votedAt: '2026-10-18T12:00:00Z' },
          user_alex: { userId: 'user_alex', userName: 'Alex Van Der Merwe', vote: 'agree', votedAt: '2026-10-19T09:30:00Z' },
          user_sipho: { userId: 'user_sipho', userName: 'Sipho Ndlovu', vote: 'agree', votedAt: '2026-10-19T14:15:00Z' },
        },
        comments: [
          {
            id: 'c-3',
            userId: 'user_sipho',
            userName: 'Sipho Ndlovu',
            text: 'Unanimous backing achieved! Structure is rated for 120km/h wind loads.',
            createdAt: '2026-10-19T14:20:00Z',
          },
        ],
        status: 'finalized_approved',
        resolvedObjections: [],
        resultingActionItemIds: ['task-1'],
        createdAt: '2026-10-15T09:00:00Z',
        finalizedAt: '2026-10-20T17:00:00Z',
      },
    ],

    flows: [
      {
        id: 'flow-1',
        name: 'Snap Slip → Budget Check → Proxy Approval',
        description: 'Captures slip, extracts total, verifies category limit, and triggers proxy approval if amount > R500.',
        isActive: true,
        createdAt: '2026-10-20T10:00:00Z',
        lastRunAt: '2026-10-28T14:30:00Z',
        blocks: [
          {
            id: 'b-1',
            type: 'start',
            label: '🟢 Start Flow',
            description: 'Triggered when a new receipt is snapped',
            config: { trigger: 'on_slip_capture' },
            color: 'bg-emerald-400',
          },
          {
            id: 'b-2',
            type: 'capture_slip',
            label: '📸 Scan & Extract Slip',
            description: 'Parse merchant, total amount and VAT',
            config: { autoExtract: true },
            color: 'bg-amber-400',
          },
          {
            id: 'b-3',
            type: 'if_else',
            label: '🔀 Check If Amount > R 500',
            description: 'Evaluate if transaction requires secondary approval',
            config: { thresholdCents: 50000, condition: 'greater_than' },
            color: 'bg-cyan-400',
          },
          {
            id: 'b-4',
            type: 'request_approval',
            label: '🤝 Request Proxy Approval',
            description: 'Assign to active proxy with approval authority',
            config: { proxyId: 'proxy-1' },
            color: 'bg-purple-400',
          },
          {
            id: 'b-5',
            type: 'update_budget',
            label: '💰 Update Budget Ledger',
            description: 'Post expense to categorized ledger',
            config: { autoPost: true },
            color: 'bg-emerald-400',
          },
          {
            id: 'b-6',
            type: 'complete',
            label: '✅ Flow Complete',
            description: 'Ledger updated & audit logged',
            config: {},
            color: 'bg-teal-400',
          },
        ],
      },
      {
        id: 'flow-2',
        name: 'Consensus Proposal → Auto Action Generator',
        description: 'Launches team proposal, notifies eligible members, and automatically creates To-Do tasks when approved.',
        isActive: true,
        createdAt: '2026-10-22T14:00:00Z',
        lastRunAt: '2026-10-29T16:00:00Z',
        blocks: [
          {
            id: 'b-10',
            type: 'start',
            label: '🟢 Start Initiative',
            description: 'Triggered on new community initiative',
            config: { trigger: 'manual' },
            color: 'bg-emerald-400',
          },
          {
            id: 'b-11',
            type: 'start_consensus',
            label: '🗳️ Launch Consensus Vote',
            description: 'Open decision board with quorum rule',
            config: { defaultRule: 'consent', minQuorum: 3 },
            color: 'bg-pink-400',
          },
          {
            id: 'b-12',
            type: 'notify',
            label: '🔔 Notify All Members',
            description: 'Broadcast decision link with deadline',
            config: { channel: 'in_app' },
            color: 'bg-yellow-400',
          },
          {
            id: 'b-13',
            type: 'add_task',
            label: '➕ Generate Action Tasks',
            description: 'Automatically create To-Do tasks from decision',
            config: { autoAssign: true },
            color: 'bg-blue-400',
          },
          {
            id: 'b-14',
            type: 'complete',
            label: '✅ Consensus Enacted',
            description: 'All tasks queued in To-Do engine',
            config: {},
            color: 'bg-teal-400',
          },
        ],
      },
    ],

    flowExecutionLogs: [
      {
        id: 'log-1',
        flowId: 'flow-1',
        flowName: 'Snap Slip → Budget Check → Proxy Approval',
        status: 'success',
        idempotencyKey: 'idem-exec-flow-1-slip-1',
        startedAt: '2026-10-28T14:28:00Z',
        completedAt: '2026-10-28T14:30:00Z',
        stepResults: [
          { blockId: 'b-1', blockType: 'start', label: '🟢 Start Flow', output: 'Triggered with slip slip-1 (R 489.90)', status: 'ok' },
          { blockId: 'b-2', blockType: 'capture_slip', label: '📸 Scan & Extract Slip', output: 'Extracted R 489.90 (VAT R 63.90) from Builders Warehouse', status: 'ok' },
          { blockId: 'b-3', blockType: 'if_else', label: '🔀 Check If Amount > R 500', output: 'Amount R 489.90 is below threshold R 500.00. Proxy approval bypassed.', status: 'ok' },
          { blockId: 'b-5', blockType: 'update_budget', label: '💰 Update Budget Ledger', output: 'Posted to Tinkering & Gear (Ledger entry led-2 created)', status: 'ok' },
          { blockId: 'b-6', blockType: 'complete', label: '✅ Flow Complete', output: 'Flow finished cleanly in 120ms', status: 'ok' },
        ],
      },
    ],
  };
}
