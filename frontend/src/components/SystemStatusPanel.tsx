"use client";

import { useMemo } from "react";
import { useSystemStatus } from "@/hooks/useSystemStatus";

interface SystemStatusPanelProps {
  compact?: boolean;
  title?: string;
  description?: string;
}

function toneClasses(tone: "healthy" | "warning" | "error") {
  if (tone === "healthy") {
    return "border-green-500/25 bg-green-500/10 text-green-300";
  }

  if (tone === "warning") {
    return "border-yellow-500/25 bg-yellow-500/10 text-yellow-300";
  }

  return "border-red-500/25 bg-red-500/10 text-red-300";
}

export function SystemStatusPanel({
  compact = false,
  title = "System Status",
  description = "Live checks across relayer health, contract readiness, and wallet environment.",
}: SystemStatusPanelProps) {
  const status = useSystemStatus();

  const checks = useMemo(
    () => [
      {
        label: "Relayer API",
        value: status.relayerReachable ? "Reachable" : "Unavailable",
        ok: status.relayerReachable,
      },
      {
        label: "Subscription Contract",
        value:
          status.contractChecks.subscriptionConfigured && status.contractChecks.subscriptionDeployed
            ? "Ready"
            : "Not Ready",
        ok:
          status.contractChecks.subscriptionConfigured && status.contractChecks.subscriptionDeployed,
      },
      {
        label: "Relayer Contract",
        value:
          status.contractChecks.relayerConfigured && status.contractChecks.relayerDeployed
            ? status.contractChecks.relayerPaused
              ? "Paused"
              : "Ready"
            : "Not Ready",
        ok:
          status.contractChecks.relayerConfigured &&
          status.contractChecks.relayerDeployed &&
          status.contractChecks.relayerPaused === false,
      },
      {
        label: "Relayer Authorization",
        value:
          status.contractChecks.relayerAuthorizedOnSubscription === null
            ? "Unknown"
            : status.contractChecks.relayerAuthorizedOnSubscription
              ? "Whitelisted"
              : "Missing",
        ok: status.contractChecks.relayerAuthorizedOnSubscription === true,
      },
      {
        label: "Wallet Network",
        value: status.wallet.correctChain ? "Arbitrum Sepolia" : "Wrong Network",
        ok: status.wallet.correctChain,
      },
      {
        label: "Relayer Funding",
        value: status.relayerHealth?.relayer?.lowBalance ? "Low Balance" : "Sufficient",
        ok: !status.relayerHealth?.relayer?.lowBalance,
      },
    ],
    [status]
  );

  return (
    <div className="glass rounded-[2rem] p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
            Runtime Health
          </p>
          <h2 className="text-xl font-semibold text-white mt-3">{title}</h2>
          <p className="text-dark-400 text-sm mt-2 max-w-2xl">{description}</p>
        </div>
        <button
          onClick={() => void status.refresh()}
          className="px-4 py-2 glass rounded-xl text-sm text-white hover:bg-white/10 transition-colors"
        >
          Refresh Checks
        </button>
      </div>

      <div className={`mt-5 rounded-2xl border px-4 py-4 ${toneClasses(status.summary.tone)}`}>
        <div className="font-semibold">{status.summary.title}</div>
        <div className="text-sm mt-1 opacity-90">{status.summary.detail}</div>
      </div>

      {status.loading ? (
        <div className="flex items-center gap-3 mt-6 text-dark-400">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <span>Running live readiness checks...</span>
        </div>
      ) : (
        <>
          <div className={`grid ${compact ? "md:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-6"} gap-3 mt-6`}>
            {checks.map((check) => (
              <div key={check.label} className="rounded-2xl border border-white/8 bg-dark-900/45 p-4">
                <div className="text-dark-500 text-xs uppercase tracking-[0.22em]">{check.label}</div>
                <div className={`mt-2 text-sm font-semibold ${check.ok ? "text-white" : "text-yellow-300"}`}>
                  {check.value}
                </div>
              </div>
            ))}
          </div>

          {!compact && (
            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-5">
                <h3 className="text-white font-semibold">Relayer Details</h3>
                <div className="space-y-2 text-sm text-dark-300 mt-4">
                  <div>
                    Address:{" "}
                    <span className="font-mono text-dark-100">
                      {status.relayerHealth?.relayer?.address || "Unavailable"}
                    </span>
                  </div>
                  <div>
                    Balance:{" "}
                    <span className="text-dark-100">
                      {status.relayerHealth?.relayer?.balance || "Unknown"} ETH
                    </span>
                  </div>
                  <div>
                    API endpoint:{" "}
                    <span className="font-mono text-dark-100 break-all">
                      {status.relayerHealth ? "Connected" : "No response"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-5">
                <h3 className="text-white font-semibold">Contract Details</h3>
                <div className="space-y-2 text-sm text-dark-300 mt-4">
                  <div>
                    Total creators:{" "}
                    <span className="text-dark-100">
                      {status.contractChecks.totalCreators !== null
                        ? status.contractChecks.totalCreators.toString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div>
                    Platform fee:{" "}
                    <span className="text-dark-100">
                      {status.contractChecks.platformFeeBps !== null
                        ? `${Number(status.contractChecks.platformFeeBps) / 100}%`
                        : "Unknown"}
                    </span>
                  </div>
                  <div>
                    Wallet network:{" "}
                    <span className="text-dark-100">
                      {status.wallet.correctChain ? "Arbitrum Sepolia" : `Chain ${status.wallet.chainId ?? "Unknown"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status.errors.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/8 bg-dark-900/45 p-5">
              <h3 className="text-white font-semibold">Warnings</h3>
              <div className="space-y-2 mt-3 text-sm text-dark-300">
                {status.errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
