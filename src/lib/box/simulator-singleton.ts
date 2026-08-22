/**
 * プロセス内シングルトンのBox Simulator。
 * Next.js dev環境からの管理画面/開発ツール操作(§12.5)向け。
 * 本番Phase Bでは実OEM adapterに差し替える(BoxProvider interfaceを実装するだけでよい)。
 */
import { BoxSimulatorProvider } from "./simulator-provider";

const globalForSim = globalThis as unknown as { camlyBoxSimulator?: BoxSimulatorProvider };

export const boxSimulator =
  globalForSim.camlyBoxSimulator ?? new BoxSimulatorProvider(process.env.BOX_COMMAND_SIGNING_SECRET || "dev-simulator-secret-change-me");

if (process.env.NODE_ENV !== "production") {
  globalForSim.camlyBoxSimulator = boxSimulator;
}

export function getActiveBoxProvider() {
  const mode = process.env.BOX_PROVIDER_MODE ?? "simulator";
  if (mode === "simulator") return boxSimulator;
  // 将来のOEM adapter: mode === "oem_adapter" のときにここで実装を差し替える。
  throw new Error(`Unknown BOX_PROVIDER_MODE: ${mode}. Only "simulator" is implemented so far.`);
}
