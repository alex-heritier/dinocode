import type { RepositoryIdentity } from "@t3tools/contracts";
import {
  DEFAULT_REPOSITORY_IDENTITY_PREFERRED_REMOTE_NAME,
  type RepositoryIdentityPreferredRemoteName,
} from "@t3tools/contracts/settings";
import { Cache, Duration, Effect, Exit, Layer } from "effect";
import { detectGitHostingProviderFromRemoteUrl, normalizeGitRemoteUrl } from "@t3tools/shared/git";

import { runProcess } from "../../processRunner.ts";
import { ServerSettingsLive, ServerSettingsService } from "../../serverSettings.ts";
import {
  RepositoryIdentityResolver,
  type RepositoryIdentityResolverShape,
} from "../Services/RepositoryIdentityResolver.ts";

function parseRemoteFetchUrls(stdout: string): Map<string, string> {
  const remotes = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const match = /^(\S+)\s+(\S+)\s+\((fetch|push)\)$/.exec(trimmed);
    if (!match) continue;
    const [, remoteName = "", remoteUrl = "", direction = ""] = match;
    if (direction !== "fetch" || remoteName.length === 0 || remoteUrl.length === 0) {
      continue;
    }
    remotes.set(remoteName, remoteUrl);
  }
  return remotes;
}

function pickPrimaryRemote(
  remotes: ReadonlyMap<string, string>,
  preferredRemoteName: RepositoryIdentityPreferredRemoteName,
): { readonly remoteName: string; readonly remoteUrl: string } | null {
  const remoteNamePreferenceOrder: ReadonlyArray<RepositoryIdentityPreferredRemoteName> =
    preferredRemoteName === "upstream" ? ["upstream", "origin"] : ["origin", "upstream"];

  for (const preferredRemoteName of remoteNamePreferenceOrder) {
    const remoteUrl = remotes.get(preferredRemoteName);
    if (remoteUrl) {
      return { remoteName: preferredRemoteName, remoteUrl };
    }
  }

  const [remoteName, remoteUrl] =
    [...remotes.entries()].toSorted(([left], [right]) => left.localeCompare(right))[0] ?? [];
  return remoteName && remoteUrl ? { remoteName, remoteUrl } : null;
}

function buildRepositoryIdentity(input: {
  readonly remoteName: string;
  readonly remoteUrl: string;
  readonly rootPath: string;
}): RepositoryIdentity {
  const canonicalKey = normalizeGitRemoteUrl(input.remoteUrl);
  const hostingProvider = detectGitHostingProviderFromRemoteUrl(input.remoteUrl);
  const repositoryPath = canonicalKey.split("/").slice(1).join("/");
  const repositoryPathSegments = repositoryPath.split("/").filter((segment) => segment.length > 0);
  const [owner] = repositoryPathSegments;
  const repositoryName = repositoryPathSegments.at(-1);

  return {
    canonicalKey,
    locator: {
      source: "git-remote",
      remoteName: input.remoteName,
      remoteUrl: input.remoteUrl,
    },
    rootPath: input.rootPath,
    ...(repositoryPath ? { displayName: repositoryPath } : {}),
    ...(hostingProvider ? { provider: hostingProvider.kind } : {}),
    ...(owner ? { owner } : {}),
    ...(repositoryName ? { name: repositoryName } : {}),
  };
}

function makeRepositoryIdentityCacheKey(
  rootPath: string,
  preferredRemoteName: RepositoryIdentityPreferredRemoteName,
): string {
  return JSON.stringify([rootPath, preferredRemoteName]);
}

function parseRepositoryIdentityCacheKey(cacheKey: string): {
  readonly rootPath: string;
  readonly preferredRemoteName: RepositoryIdentityPreferredRemoteName;
} {
  try {
    const parsed = JSON.parse(cacheKey) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      const preferredRemoteName =
        parsed[1] === "upstream" ? "upstream" : DEFAULT_REPOSITORY_IDENTITY_PREFERRED_REMOTE_NAME;
      return {
        rootPath: parsed[0],
        preferredRemoteName,
      };
    }
  } catch {
    // Fall through to the raw cache key for older in-memory entries.
  }

  return {
    rootPath: cacheKey,
    preferredRemoteName: DEFAULT_REPOSITORY_IDENTITY_PREFERRED_REMOTE_NAME,
  };
}

const DEFAULT_REPOSITORY_IDENTITY_CACHE_CAPACITY = 512;
const DEFAULT_POSITIVE_CACHE_TTL = Duration.minutes(1);
const DEFAULT_NEGATIVE_CACHE_TTL = Duration.minutes(1);

interface RepositoryIdentityResolverOptions {
  readonly cacheCapacity?: number;
  readonly positiveCacheTtl?: Duration.Input;
  readonly negativeCacheTtl?: Duration.Input;
  readonly getPreferredRemoteName?: () => Effect.Effect<RepositoryIdentityPreferredRemoteName>;
}

async function resolveRepositoryIdentityCacheKey(
  cwd: string,
  preferredRemoteName: RepositoryIdentityPreferredRemoteName,
): Promise<string> {
  let cacheKey = cwd;

  try {
    const topLevelResult = await runProcess("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      allowNonZeroExit: true,
    });
    if (topLevelResult.code !== 0) {
      return cacheKey;
    }

    const candidate = topLevelResult.stdout.trim();
    if (candidate.length > 0) {
      cacheKey = candidate;
    }
  } catch {
    return cacheKey;
  }

  return makeRepositoryIdentityCacheKey(cacheKey, preferredRemoteName);
}

async function resolveRepositoryIdentityFromCacheKey(
  cacheKey: string,
): Promise<RepositoryIdentity | null> {
  try {
    const { rootPath, preferredRemoteName } = parseRepositoryIdentityCacheKey(cacheKey);
    const remoteResult = await runProcess("git", ["-C", rootPath, "remote", "-v"], {
      allowNonZeroExit: true,
    });
    if (remoteResult.code !== 0) {
      return null;
    }

    const remote = pickPrimaryRemote(
      parseRemoteFetchUrls(remoteResult.stdout),
      preferredRemoteName,
    );
    return remote ? buildRepositoryIdentity({ ...remote, rootPath }) : null;
  } catch {
    return null;
  }
}

export const makeRepositoryIdentityResolver = Effect.fn("makeRepositoryIdentityResolver")(
  function* (options: RepositoryIdentityResolverOptions = {}) {
    const repositoryIdentityCache = yield* Cache.makeWith<string, RepositoryIdentity | null>(
      (cacheKey) => Effect.promise(() => resolveRepositoryIdentityFromCacheKey(cacheKey)),
      {
        capacity: options.cacheCapacity ?? DEFAULT_REPOSITORY_IDENTITY_CACHE_CAPACITY,
        timeToLive: Exit.match({
          onSuccess: (value) =>
            value === null
              ? (options.negativeCacheTtl ?? DEFAULT_NEGATIVE_CACHE_TTL)
              : (options.positiveCacheTtl ?? DEFAULT_POSITIVE_CACHE_TTL),
          onFailure: () => Duration.zero,
        }),
      },
    );

    const resolve: RepositoryIdentityResolverShape["resolve"] = Effect.fn(
      "RepositoryIdentityResolver.resolve",
    )(function* (cwd) {
      const preferredRemoteName = yield* (
        options.getPreferredRemoteName?.() ??
          Effect.succeed(DEFAULT_REPOSITORY_IDENTITY_PREFERRED_REMOTE_NAME)
      );
      const cacheKey = yield* Effect.promise(() =>
        resolveRepositoryIdentityCacheKey(cwd, preferredRemoteName),
      );
      return yield* Cache.get(repositoryIdentityCache, cacheKey);
    });

    return {
      resolve,
    } satisfies RepositoryIdentityResolverShape;
  },
);

export const RepositoryIdentityResolverLive = Layer.effect(
  RepositoryIdentityResolver,
  makeRepositoryIdentityResolver(),
);

const RepositoryIdentityResolverConfiguredLayer = Layer.effect(
  RepositoryIdentityResolver,
  Effect.gen(function* () {
    const serverSettings = yield* ServerSettingsService;
    return yield* makeRepositoryIdentityResolver({
      getPreferredRemoteName: () =>
        serverSettings.getSettings.pipe(
          Effect.map((settings) => settings.repositoryIdentityPreferredRemoteName),
          Effect.orElseSucceed(() => DEFAULT_REPOSITORY_IDENTITY_PREFERRED_REMOTE_NAME),
        ),
    });
  }),
);

export const RepositoryIdentityResolverConfiguredLive =
  RepositoryIdentityResolverConfiguredLayer.pipe(Layer.provideMerge(ServerSettingsLive));
