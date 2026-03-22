"use client";

import { useState, useEffect } from "react";

type TxStatus = "pending" | "confirming" | "success" | "error";

interface TransactionStatusProps {
  status: TxStatus;
  hash?: string;
  error?: string;
  onClose?: () => void;
}

export function TransactionStatus({
  status,
  hash,
  error,
  onClose,
}: TransactionStatusProps) {
  const [dots, setDots] = useState("");

  // Animate dots for pending states
  useEffect(() => {
    if (status === "pending" || status === "confirming") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const config = {
    pending: {
      icon: (
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      ),
      title: `Waiting for signature${dots}`,
      description: "Please confirm in your wallet",
      color: "text-primary-400",
    },
    confirming: {
      icon: (
        <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
      ),
      title: `Transaction pending${dots}`,
      description: "Waiting for blockchain confirmation",
      color: "text-yellow-400",
    },
    success: {
      icon: (
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      ),
      title: "Transaction successful!",
      description: "Your transaction has been confirmed",
      color: "text-green-400",
    },
    error: {
      icon: (
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      ),
      title: "Transaction failed",
      description: error || "Something went wrong",
      color: "text-red-400",
    },
  };

  const current = config[status];

  return (
    <div className="flex flex-col items-center text-center p-6">
      {/* Icon */}
      <div className="mb-4">{current.icon}</div>

      {/* Title */}
      <h3 className={`text-lg font-semibold ${current.color}`}>
        {current.title}
      </h3>

      {/* Description */}
      <p className="text-dark-400 text-sm mt-1">{current.description}</p>

      {/* Transaction Hash Link */}
      {hash && (status === "confirming" || status === "success") && (
        <a
          href={`https://sepolia.arbiscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
        >
          View on Arbiscan
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Close button for final states */}
      {(status === "success" || status === "error") && onClose && (
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 glass rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          {status === "success" ? "Done" : "Close"}
        </button>
      )}
    </div>
  );
}

// Compact inline transaction status
export function TransactionBadge({
  status,
  hash,
}: {
  status: TxStatus;
  hash?: string;
}) {
  const config = {
    pending: {
      bg: "bg-primary-500/20",
      text: "text-primary-400",
      label: "Signing...",
    },
    confirming: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      label: "Confirming...",
    },
    success: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      label: "Confirmed",
    },
    error: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      label: "Failed",
    },
  };

  const current = config[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${current.bg} ${current.text} text-sm`}
    >
      {(status === "pending" || status === "confirming") && (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {status === "success" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === "error" && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{current.label}</span>
      {hash && status === "success" && (
        <a
          href={`https://sepolia.arbiscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          View
        </a>
      )}
    </div>
  );
}
