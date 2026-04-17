"use client";

import type { Creator, CreatorContentProfile, CreatorMetadata } from "@/types";

interface RawCreatorData {
  address: string;
  subscriberCount: string;
  subscriptionPrice: string;
  subscriptionDuration?: string;
  payoutAddress: string;
  contentURI: string;
}

function normalizeContentProfile(
  contentProfile?: CreatorMetadata["contentProfile"]
): CreatorContentProfile | undefined {
  if (!contentProfile) return undefined;

  return {
    title: contentProfile.title?.trim() || undefined,
    summary: contentProfile.summary?.trim() || undefined,
    previewNote: contentProfile.previewNote?.trim() || undefined,
    deliveryMethod: contentProfile.deliveryMethod,
    accessInstructions: contentProfile.accessInstructions?.trim() || undefined,
    cadence: contentProfile.cadence?.trim() || undefined,
    category: contentProfile.category?.trim() || undefined,
  };
}

export function parseCreatorData(raw: RawCreatorData): Creator {
  let name = `${raw.address.slice(0, 6)}...${raw.address.slice(-4)}`;
  let bio = "";
  let contentURL = "";
  let avatar: string | undefined;
  let banner: string | undefined;
  let socialLinks: Creator["socialLinks"];
  let contentProfile: Creator["contentProfile"];

  try {
    const meta = JSON.parse(raw.contentURI) as CreatorMetadata;
    if (meta.name) name = meta.name;
    if (meta.bio) bio = meta.bio;
    if (meta.contentURL) contentURL = meta.contentURL;
    avatar = meta.avatar;
    banner = meta.banner;
    socialLinks = meta.socialLinks;
    contentProfile = normalizeContentProfile(meta.contentProfile);
  } catch {
    if (raw.contentURI && !raw.contentURI.startsWith("{")) {
      const parts = raw.contentURI.split("/");
      name = decodeURIComponent(parts[parts.length - 1] || name);
    }
  }

  return {
    address: raw.address,
    name,
    bio,
    avatar,
    banner,
    subscriberCount: raw.subscriberCount,
    subscriptionPrice: raw.subscriptionPrice,
    subscriptionDuration: raw.subscriptionDuration || "2592000",
    payoutAddress: raw.payoutAddress,
    contentURI: raw.contentURI,
    contentURL,
    socialLinks,
    contentProfile,
  };
}

export function buildCreatorMetadata(input: {
  name: string;
  bio: string;
  contentURL?: string;
  avatar?: string;
  banner?: string;
  socialLinks?: CreatorMetadata["socialLinks"];
  contentProfile?: CreatorMetadata["contentProfile"];
}) {
  const metadata: CreatorMetadata = {
    name: input.name.trim(),
    bio: input.bio.trim(),
  };

  if (input.contentURL?.trim()) {
    metadata.contentURL = input.contentURL.trim();
  }

  if (input.avatar?.trim()) {
    metadata.avatar = input.avatar.trim();
  }

  if (input.banner?.trim()) {
    metadata.banner = input.banner.trim();
  }

  if (input.socialLinks) {
    metadata.socialLinks = {
      twitter: input.socialLinks.twitter?.trim() || undefined,
      instagram: input.socialLinks.instagram?.trim() || undefined,
      website: input.socialLinks.website?.trim() || undefined,
    };
  }

  const contentProfile = normalizeContentProfile(input.contentProfile);
  if (contentProfile) {
    metadata.contentProfile = contentProfile;
  }

  return JSON.stringify(metadata);
}
