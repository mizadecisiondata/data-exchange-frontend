export type DemoState = {
  status: string;
  generatedAt: string;
  client: {
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
  accessRequest: {
    id: string;
    state: string;
    blockingDocumentsMissing: string[];
  };
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
  creditsUsed: number;
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
  creditsUsed: number;
  creditsBalance: number;
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
