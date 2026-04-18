export {
  summarize,
  type Severity,
  type ValidationIssue,
  type ValidationReport,
} from "./issue.js";
export { runValidator, type RunOptions } from "./run.js";
export { checkSchema, type LoadedEntry } from "./checks/schema.js";
export { checkDuplicates } from "./checks/duplicates.js";
export { checkFileExistence } from "./checks/file-existence.js";
export { checkSecurity } from "./checks/security.js";
