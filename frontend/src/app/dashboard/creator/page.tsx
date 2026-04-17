"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCreatorDashboard } from "@/hooks/useCreatorDashboard";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";
import type { CreatorDeliveryMethod } from "@/types";

interface CreatorFormData {
  name: string;
  bio: string;
  price: string;
  durationDays: string;
  payoutAddress: string;
  contentURL: string;
  avatar: string;
  banner: string;
  contentTitle: string;
  contentSummary: string;
  previewNote: string;
  deliveryMethod: CreatorDeliveryMethod;
  accessInstructions: string;
  cadence: string;
  category: string;
  twitter: string;
  instagram: string;
  website: string;
}

const defaultFormData: CreatorFormData = {
  name: "",
  bio: "",
  price: "0.01",
  durationDays: "30",
  payoutAddress: "",
  contentURL: "",
  avatar: "",
  banner: "",
  contentTitle: "",
  contentSummary: "",
  previewNote: "",
  deliveryMethod: "vault",
  accessInstructions: "",
  cadence: "",
  category: "",
  twitter: "",
  instagram: "",
  website: "",
};

const deliveryOptions: Array<{
  value: CreatorDeliveryMethod;
  label: string;
  description: string;
}> = [
  {
    value: "vault",
    label: "Private vault link",
    description: "A private destination that opens after access verification.",
  },
  {
    value: "folder",
    label: "Shared folder",
    description: "Drive, Dropbox, or IPFS collection that you update continuously.",
  },
  {
    value: "drop",
    label: "Periodic drops",
    description: "Content arrives on a cadence, with new links or files added over time.",
  },
  {
    value: "direct-link",
    label: "Single premium asset",
    description: "One direct URL or page for this tier.",
  },
  {
    value: "livestream",
    label: "Live session access",
    description: "Subscribers unlock access instructions for live events or rooms.",
  },
];

function toFormData(input: typeof defaultFormData, profile?: ReturnType<typeof useCreatorDashboard>["profile"]) {
  if (!profile) return input;

  return {
    name: profile.name,
    bio: profile.bio,
    price: formatEther(BigInt(profile.subscriptionPrice)),
    durationDays: Math.max(1, Math.round(Number(profile.subscriptionDuration) / (24 * 60 * 60))).toString(),
    payoutAddress: profile.payoutAddress,
    contentURL: profile.contentURL || "",
    avatar: profile.avatar || "",
    banner: profile.banner || "",
    contentTitle: profile.contentProfile?.title || "",
    contentSummary: profile.contentProfile?.summary || "",
    previewNote: profile.contentProfile?.previewNote || "",
    deliveryMethod: profile.contentProfile?.deliveryMethod || "vault",
    accessInstructions: profile.contentProfile?.accessInstructions || "",
    cadence: profile.contentProfile?.cadence || "",
    category: profile.contentProfile?.category || "",
    twitter: profile.socialLinks?.twitter || "",
    instagram: profile.socialLinks?.instagram || "",
    website: profile.socialLinks?.website || "",
  };
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-white font-semibold mb-1">{label}</label>
      {helper && <p className="text-dark-500 text-xs mb-2">{helper}</p>}
      {children}
    </div>
  );
}

export default function CreatorDashboardPage() {
  const { isConnected, address } = useAccount();
  const {
    profile,
    isLoading,
    isRegistered,
    revenue,
    isDecryptingRevenue,
    revenueDecryptStep,
    registerCreator,
    updateProfile,
    requestRevenueDecrypt,
    withdrawRevenue,
    isRegistering,
    isWithdrawing,
  } = useCreatorDashboard();

  const [formData, setFormData] = useState<CreatorFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    if (address && !formData.payoutAddress) {
      setFormData((prev) => ({ ...prev, payoutAddress: address }));
    }
  }, [address, formData.payoutAddress]);

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData(toFormData(defaultFormData, profile));
    }
  }, [profile, isEditing]);

  const creatorReceives = useMemo(() => {
    const raw = Number.parseFloat(formData.price || "0");
    return Number.isFinite(raw) ? (raw * 0.95).toFixed(4) : "0.0000";
  }, [formData.price]);

  const previewName = formData.name || "Your creator name";
  const previewBio =
    formData.bio || "Describe what subscribers get, your tone, and why your private tier matters.";
  const previewContentTitle = formData.contentTitle || "Private subscriber vault";
  const previewContentSummary =
    formData.contentSummary ||
    "Tease the experience without leaking the delivery destination.";

  if (!isConnected) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-dark-400 mb-8">Connect your wallet to access creator studio.</p>
            <ConnectButton />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError(null);

    const payload = {
      name: formData.name,
      bio: formData.bio,
      contentURL: formData.contentURL,
      subscriptionPrice: parseEther(formData.price),
      subscriptionDurationDays: Number.parseInt(formData.durationDays, 10),
      payoutAddress: formData.payoutAddress as `0x${string}`,
      avatar: formData.avatar,
      banner: formData.banner,
      socialLinks: {
        twitter: formData.twitter,
        instagram: formData.instagram,
        website: formData.website,
      },
      contentProfile: {
        title: formData.contentTitle,
        summary: formData.contentSummary,
        previewNote: formData.previewNote,
        deliveryMethod: formData.deliveryMethod,
        accessInstructions: formData.accessInstructions,
        cadence: formData.cadence,
        category: formData.category,
      },
    };

    try {
      if (isRegistered) {
        await updateProfile(payload);
        setIsEditing(false);
      } else {
        await registerCreator(payload);
      }
    } catch (error: any) {
      setRegisterError(error?.message || "Could not save creator profile.");
    }
  };

  const priceInEth = profile ? formatEther(BigInt(profile.subscriptionPrice)) : formData.price;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
              Creator Operations
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-3">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isRegistered ? "Creator Studio" : "Launch Creator Studio"}
                </h1>
                <p className="text-dark-400 mt-2 max-w-3xl">
                  Configure your public profile, private delivery structure, pricing model, and
                  relayer-compatible payout setup. Everything here is aligned with the live Fhenix
                  flow instead of a mock creator CMS.
                </p>
              </div>
              {isRegistered && (
                <a
                  href={`/creator/${address}`}
                  className="px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors text-center"
                >
                  View Public Profile
                </a>
              )}
            </div>
          </div>

          <div className="mb-8">
            <SystemStatusPanel
              title="Creator Runtime Status"
              description="These checks confirm whether the relayer, contract wiring, and wallet environment are ready before you register, decrypt revenue, or withdraw."
            />
          </div>

          {isRegistered && (
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-2xl p-5">
                <div className="text-dark-400 text-sm">Subscribers</div>
                <div className="text-3xl font-bold text-white mt-2">{profile?.subscriberCount || 0}</div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-dark-400 text-sm">Tier Price</div>
                <div className="text-3xl font-bold text-primary-400 mt-2">
                  {Number.parseFloat(priceInEth).toFixed(4)} ETH
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-dark-400 text-sm">Cycle</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {Math.max(1, Math.round(Number(profile?.subscriptionDuration || "2592000") / 86400))}d
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-dark-400 text-sm">Private Revenue</div>
                {revenue !== null ? (
                  <div className="text-3xl font-bold text-green-400 mt-2">{formatEther(revenue)} ETH</div>
                ) : (
                  <button
                    onClick={requestRevenueDecrypt}
                    disabled={isDecryptingRevenue}
                    className="mt-2 text-primary-400 hover:text-primary-300 flex items-center gap-2"
                  >
                    {isDecryptingRevenue ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{revenueDecryptStep || "Decrypting..."}</span>
                      </>
                    ) : (
                      <span>Reveal Revenue</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {isRegistered && (
            <div className="glass rounded-[2rem] p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Revenue Operations</h2>
                  <p className="text-dark-400 text-sm mt-1">
                    Revenue decryption and withdrawal are still explicit privacy-preserving actions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={requestRevenueDecrypt}
                    disabled={isDecryptingRevenue}
                    className="px-5 py-3 glass rounded-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {isDecryptingRevenue ? revenueDecryptStep || "Decrypting..." : "Refresh Revenue"}
                  </button>
                  <button
                    onClick={withdrawRevenue}
                    disabled={isWithdrawing || revenue === null || revenue === BigInt(0)}
                    className="px-5 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw Revenue"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6">
            <form onSubmit={submit} className="glass rounded-[2rem] p-6 md:p-7 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                    Studio Form
                  </p>
                  <h2 className="text-2xl font-semibold text-white mt-3">
                    {isRegistered ? "Update creator profile" : "Register your creator profile"}
                  </h2>
                </div>
                {isRegistered && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors"
                  >
                    Edit Studio
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  label="Display Name"
                  helper="Public-facing identity that appears in creator discovery."
                >
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    required
                    disabled={isRegistered && !isEditing}
                    className="input disabled:opacity-70"
                  />
                </FormField>

                <FormField
                  label="Category"
                  helper="Internal framing for fans. Example: photo sets, live sessions, private drops."
                >
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                    disabled={isRegistered && !isEditing}
                    className="input disabled:opacity-70"
                  />
                </FormField>
              </div>

              <FormField
                label="Bio"
                helper="Explain the experience and why subscribers join this private tier."
              >
                <textarea
                  value={formData.bio}
                  onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                  rows={4}
                  disabled={isRegistered && !isEditing}
                  className="input resize-none disabled:opacity-70"
                />
              </FormField>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  label="Banner Image URL"
                  helper="Optional hero visual for your public profile."
                >
                  <input
                    type="url"
                    value={formData.banner}
                    onChange={(event) => setFormData((prev) => ({ ...prev, banner: event.target.value }))}
                    disabled={isRegistered && !isEditing}
                    className="input disabled:opacity-70"
                  />
                </FormField>

                <FormField
                  label="Avatar Image URL"
                  helper="Optional square avatar used in cards and profile header."
                >
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(event) => setFormData((prev) => ({ ...prev, avatar: event.target.value }))}
                    disabled={isRegistered && !isEditing}
                    className="input disabled:opacity-70"
                  />
                </FormField>
              </div>

              <div className="pt-2 border-t border-white/8">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em] mb-5">
                  Delivery Setup
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    label="Content Title"
                    helper="Short title for the private experience fans are unlocking."
                  >
                    <input
                      type="text"
                      value={formData.contentTitle}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, contentTitle: event.target.value }))
                      }
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>

                  <FormField
                    label="Delivery Method"
                    helper="How subscribers should think about receiving access."
                  >
                    <select
                      value={formData.deliveryMethod}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryMethod: event.target.value as CreatorDeliveryMethod,
                        }))
                      }
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    >
                      {deliveryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    label="Content URL"
                    helper="Destination unlocked after subscriber-side verification."
                  >
                    <input
                      type="url"
                      value={formData.contentURL}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, contentURL: event.target.value }))
                      }
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>

                  <FormField
                    label="Cadence"
                    helper="Example: weekly drops, daily photo set, monthly session."
                  >
                    <input
                      type="text"
                      value={formData.cadence}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, cadence: event.target.value }))
                      }
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>
                </div>

                <div className="mt-6">
                  <FormField
                    label="Content Summary"
                    helper="What fans can expect, without leaking the destination itself."
                  >
                    <textarea
                      value={formData.contentSummary}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, contentSummary: event.target.value }))
                      }
                      rows={3}
                      disabled={isRegistered && !isEditing}
                      className="input resize-none disabled:opacity-70"
                    />
                  </FormField>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    label="Preview Note"
                    helper="Short teaser shown publicly to increase conversion."
                  >
                    <textarea
                      value={formData.previewNote}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, previewNote: event.target.value }))
                      }
                      rows={3}
                      disabled={isRegistered && !isEditing}
                      className="input resize-none disabled:opacity-70"
                    />
                  </FormField>

                  <FormField
                    label="Access Instructions"
                    helper="What a verified subscriber should know after the content link opens."
                  >
                    <textarea
                      value={formData.accessInstructions}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          accessInstructions: event.target.value,
                        }))
                      }
                      rows={3}
                      disabled={isRegistered && !isEditing}
                      className="input resize-none disabled:opacity-70"
                    />
                  </FormField>
                </div>
              </div>

              <div className="pt-2 border-t border-white/8">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em] mb-5">
                  Monetization and Ops
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  <FormField
                    label="Subscription Price (ETH)"
                    helper="Current product fee is 5%, so you keep 95%."
                  >
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.price}
                      onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                      required
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>

                  <FormField
                    label="Billing Cycle (days)"
                    helper="Stored on-chain as the subscription duration."
                  >
                    <input
                      type="number"
                      min="1"
                      value={formData.durationDays}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, durationDays: event.target.value }))
                      }
                      required
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>

                  <FormField
                    label="Payout Address"
                    helper="Where decrypted revenue is sent when you withdraw."
                  >
                    <input
                      type="text"
                      value={formData.payoutAddress}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, payoutAddress: event.target.value }))
                      }
                      required
                      disabled={isRegistered && !isEditing}
                      className="input font-mono text-sm disabled:opacity-70"
                    />
                  </FormField>
                </div>

                <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4 mt-6 text-sm text-dark-200">
                  Estimated creator take per subscription: <span className="text-white font-semibold">{creatorReceives} ETH</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/8">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em] mb-5">
                  Social Presence
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <FormField label="Twitter / X">
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(event) => setFormData((prev) => ({ ...prev, twitter: event.target.value }))}
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>
                  <FormField label="Instagram">
                    <input
                      type="url"
                      value={formData.instagram}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, instagram: event.target.value }))
                      }
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>
                  <FormField label="Website">
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(event) => setFormData((prev) => ({ ...prev, website: event.target.value }))}
                      disabled={isRegistered && !isEditing}
                      className="input disabled:opacity-70"
                    />
                  </FormField>
                </div>
              </div>

              {registerError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {registerError}
                </div>
              )}

              {(!isRegistered || isEditing) && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering
                      ? isRegistered
                        ? "Saving on-chain..."
                        : "Registering on-chain..."
                      : isRegistered
                        ? "Save Studio Changes"
                        : "Register Creator Profile"}
                  </button>

                  {isRegistered && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setRegisterError(null);
                        if (profile) {
                          setFormData(toFormData(defaultFormData, profile));
                        }
                      }}
                      className="px-6 py-4 glass rounded-xl text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>

            <div className="space-y-6">
              <div className="glass rounded-[2rem] p-6">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                  Public Preview
                </p>
                <div className="rounded-[1.5rem] overflow-hidden border border-white/8 bg-dark-900/45 mt-5">
                  <div className="h-28 bg-gradient-to-br from-primary-600/30 to-amber-500/20 relative">
                    {formData.banner && (
                      <img src={formData.banner} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="px-5 pb-5">
                    <div className="w-16 h-16 rounded-2xl bg-dark-800 -mt-8 border-4 border-dark-950 overflow-hidden flex items-center justify-center">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {previewName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-white text-xl font-semibold mt-4">{previewName}</div>
                    <div className="text-dark-400 text-sm mt-3">{previewBio}</div>
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="rounded-2xl border border-white/8 bg-dark-950/50 p-4">
                        <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Price</div>
                        <div className="text-primary-300 font-semibold mt-2">{formData.price || "0.01"} ETH</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-dark-950/50 p-4">
                        <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Cycle</div>
                        <div className="text-white font-semibold mt-2">{formData.durationDays || "30"} days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                  Delivery Preview
                </p>
                <div className="space-y-4 mt-5">
                  <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-4">
                    <div className="text-white font-semibold">{previewContentTitle}</div>
                    <div className="text-dark-400 text-sm mt-2">{previewContentSummary}</div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-4">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Delivery Mode</div>
                    <div className="text-white font-semibold mt-2">
                      {deliveryOptions.find((item) => item.value === formData.deliveryMethod)?.label}
                    </div>
                    <div className="text-dark-400 text-sm mt-2">
                      {deliveryOptions.find((item) => item.value === formData.deliveryMethod)?.description}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-4">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Preview Note</div>
                    <div className="text-dark-300 text-sm mt-2">
                      {formData.previewNote || "Add a teaser so fans know what private access feels like before subscribing."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-dark-900/45 p-4">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Access Instructions</div>
                    <div className="text-dark-300 text-sm mt-2">
                      {formData.accessInstructions || "Explain what verified fans should do after the content destination opens."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6">
                <h3 className="text-white font-semibold">Privacy and delivery notes</h3>
                <div className="space-y-3 mt-4 text-sm text-dark-300">
                  <div>Your content URL is not enough on its own. Fans still need to complete access verification before it is shown.</div>
                  <div>Revenue visibility remains creator-only. Decryption and withdrawal are separate explicit actions.</div>
                  <div>The studio metadata is flexible JSON inside `contentURI`, so you can iterate on UX without redeploying contracts.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
