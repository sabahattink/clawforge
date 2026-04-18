export { addCommand, type AddOptions, type AddResult } from "./commands/add.js";
export { browseCommand } from "./commands/browse.js";
export { doctorCommand, type DoctorOptions, type DoctorReport } from "./commands/doctor.js";
export { infoCommand, type InfoOptions } from "./commands/info.js";
export { initCommand, type InitOptions, type InitResult } from "./commands/init.js";
export { listCommand, type ListOptions } from "./commands/list.js";
export { removeCommand, type RemoveOptions, type RemoveResult } from "./commands/remove.js";
export { searchCommand, type SearchOptions } from "./commands/search.js";
export { updateCommand, type UpdateOptions, type UpdatePlan } from "./commands/update.js";
export { installEntry } from "./installers/dispatch.js";
export { installFiles } from "./installers/files.js";
export { installMerge } from "./installers/merge.js";
export type {
  InstallerContext,
  InstallResult,
  PromptFn,
} from "./installers/types.js";
export {
  emptyManifest,
  type InstalledRecord,
  type JsonMergeRecord,
  type Manifest,
  type Scope,
} from "./manifest/types.js";
export {
  readManifest,
  removeById,
  upsert,
  writeManifest,
} from "./manifest/io.js";
export {
  HttpRegistryClient,
  type HttpClientOptions,
  type RegistryClient,
} from "./registry/client.js";
export { resolveScope, type ResolvedScope, type ResolveOptions } from "./scope/resolve.js";
