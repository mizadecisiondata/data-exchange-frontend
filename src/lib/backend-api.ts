export type DemoState = {
  status: string;
  generatedAt: string;
  client: {
    id: string;
    legalName: string;
    sector: string;
    mode: string;
    state: string;
    productionAccess: boolean;
    sandboxUploadAllowed: boolean;
    creditsBalance: number;
  };
  documents: Record<string, boolean>;
  uploads: UploadSummary[];
  queries: QueryAudit[];
  batchQueries: BatchSummary[];
  subUsers: SubUser[];
  usage: UsageSummary;
  outbox: OutboxEmail[];
  invoicePreview: InvoicePreview;
  adminClients: AdminClient[];
  adminUsers: AdminUser[];
  globalUsage: GlobalUsage;
  ingestionDashboard: IngestionDashboard;
  auditLog: AdminAuditEvent[];
  notifications: AdminNotification[];
  settings: AdminSettings;
  accessRequest: {
    id: string;
    state: string;
    blockingDocumentsMissing: string[];
  };
};

export type AdminClient = {
  id: string;
  requestId: string;
  legalName: string;
  sector: string;
  mode: string;
  state: string;
  productionAccess: boolean;
  sandboxUploadAllowed: boolean;
  creditsBalance: number;
  blockingDocumentsMissing: string[];
  documents: Record<string, boolean>;
  uploads: UploadSummary[];
  queries: QueryAudit[];
  batchQueries: BatchSummary[];
  subUsers: SubUser[];
  usage: UsageSummary;
  outbox: OutboxEmail[];
  invoicePreview: InvoicePreview;
  createdAt: string;
  latestUploadAt: string | null;
  latestQueryAt: string | null;
  statusLabel: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "blocked";
  modules: string[];
  createdAt: string;
};

export type GlobalUsage = {
  basicReports: number;
  completeReports: number;
  apiCalls: number;
  estimatedSubtotal: number;
  creditsGenerated: number;
  currentCreditsGenerated: number;
  historicalCreditsGenerated: number;
  creditsUsed: number;
  creditsDepreciated: number;
  productiveClients: number;
  pendingClients: number;
  totalQueries: number;
  series: Array<{ label: string; queries: number; amount: number }>;
  productMix: Array<{ label: string; count: number }>;
  byClient: Array<{ clientId: string; legalName: string; queries: number; uploads: number; subtotal: number; state: string }>;
};

export type IngestionDashboard = {
  uploads: Array<UploadSummary & { clientId: string; clientName: string }>;
  acceptedRows: number;
  duplicateRows: number;
  errorRows: number;
  qualityThreshold: number;
  byClient: Array<{ clientId: string; legalName: string; uploads: number; acceptedRows: number; creditsGenerated: number }>;
};

export type AdminAuditEvent = {
  id: string;
  type: string;
  actor: string;
  clientId: string;
  clientName: string;
  channel: string;
  product?: string;
  tariff?: string;
  estimatedValue?: number;
  status: string;
  detail: string;
  createdAt: string;
};

export type AdminNotification = OutboxEmail & {
  clientId: string;
  clientName: string;
};

export type AdminSettings = {
  qualityThreshold: number;
  billingMode: string;
  allowPricingAutomation: boolean;
  emailProvider: string;
  devMonitorExternal: boolean;
  sbInhabilitationIncludedInPanorama: boolean;
};

export type UploadSummary = {
  id: string;
  status: string;
  mode: string;
  rowsReceived: number;
  acceptedRows: number;
  duplicateRows: number;
  errorRows: number;
  qualityScore: number;
  threshold: number;
  creditsGenerated: number;
  currentCreditsGenerated?: number;
  historicalCreditsGenerated?: number;
  creditGeneration?: {
    currentRows: number;
    historicalRows: number;
    currentCredits: number;
    historicalCredits: number;
    totalCredits: number;
    policy: string;
  };
  createdAt: string;
};

export type QueryAudit = {
  id: string;
  bac: string;
  consent: string;
  user: string;
  channel: string;
  ip: string;
  identifierType: string;
  identifier: string;
  product: string;
  tariff: string;
  estimatedValue: number;
  tariffTier?: string;
  unitPrice?: number;
  creditApplied?: boolean;
  creditCost?: number;
  tariffBucket?: "data_partner_credit" | "excess_cliente_normal" | "cliente_normal";
  inhabilitations?: InhabilitationsResult;
  status: string;
  createdAt: string;
};

export type InhabilitationsResult = {
  isInhabilitated: boolean;
  status: "habilitado" | "inhabilitado";
  checkedCapabilities: string[];
  reason: string;
  source: string;
  effectiveDate: string;
};

export type BatchSummary = {
  id: string;
  status: string;
  rowsReceived: number;
  rowsProcessed: number;
  completeReportRows?: number;
  sebInhabilitatedRows?: number;
  estimatedSubtotal: number;
  createdAt: string;
};

export type UsageSummary = {
  basicReports: number;
  completeReports: number;
  apiCalls: number;
  estimatedSubtotal: number;
  creditsGenerated: number;
  currentCreditsGenerated: number;
  historicalCreditsGenerated: number;
  creditsUsed: number;
  creditsDepreciated: number;
  dataPartnerCreditQueries: number;
  dataPartnerCreditSubtotal: number;
  excessNormalQueries: number;
  excessNormalSubtotal: number;
  clienteNormalQueries: number;
  clienteNormalSubtotal: number;
};

export type SubUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "blocked";
  allowedModules: string[];
  mustChangeTemporaryPassword: boolean;
  createdAt: string;
};

export type InvoicePreview = {
  period: string;
  currency: string;
  billingMode: string;
  subtotal: number;
  tax: number;
  total: number;
  creditsGenerated: number;
  currentCreditsGenerated?: number;
  historicalCreditsGenerated?: number;
  creditsUsed: number;
  creditsDepreciated?: number;
  creditsBalance: number;
  balanceDepreciationPolicy?: {
    monthlyFixedCredits: number;
    projectedMonthlyDepreciation: number;
    projectedBalanceAfterDepreciation: number;
    description: string;
  };
  breakdown?: {
    dataPartnerCreditQueries: number;
    dataPartnerCreditSubtotal: number;
    excessNormalQueries: number;
    excessNormalSubtotal: number;
    clienteNormalQueries: number;
    clienteNormalSubtotal: number;
  };
  note: string;
};

export type OutboxEmail = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  body?: string;
  createdAt: string;
};

export async function backendGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/backend${path}`, { cache: "no-store" });
  return parseResponse<T>(response);
}

export async function backendPost<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message ?? payload.reason ?? "Backend request failed");
  }
  return payload as T;
}
