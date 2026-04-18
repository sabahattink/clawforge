export type Severity = "BLOCK" | "WARN" | "INFO";

export type ValidationIssue = {
  code: string;
  severity: Severity;
  message: string;
  path?: string;
  id?: string;
};

export type ValidationReport = {
  issues: ValidationIssue[];
  blockingCount: number;
  warningCount: number;
};

export function summarize(issues: ValidationIssue[]): ValidationReport {
  const blockingCount = issues.filter((i) => i.severity === "BLOCK").length;
  const warningCount = issues.filter((i) => i.severity === "WARN").length;
  return { issues, blockingCount, warningCount };
}
