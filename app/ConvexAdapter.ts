/**
 * NextAuth Auth.js adapter: roept Convex authAdapter-mutations/queries aan vanaf de Next.js server.
 * Zie https://stack.convex.dev/nextauth-adapter
 */
import type {
  Adapter,
  AdapterAccount,
  AdapterAuthenticator,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "@auth/core/adapters";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type User = AdapterUser & { id: Id<"users"> };
type Session = AdapterSession & { userId: Id<"users"> };
type Account = AdapterAccount & { userId: Id<"users"> };
type Authenticator = AdapterAuthenticator & { userId: Id<"users"> };

if (process.env.CONVEX_AUTH_ADAPTER_SECRET === undefined) {
  throw new Error("Missing CONVEX_AUTH_ADAPTER_SECRET environment variable");
}

function addSecret(args: Record<string, unknown>) {
  return { ...args, secret: process.env.CONVEX_AUTH_ADAPTER_SECRET! };
}

function callQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: Omit<FunctionArgs<Query>, "secret">
) {
  return fetchQuery(query, addSecret(args) as FunctionArgs<Query>);
}

function callMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
  args: Omit<FunctionArgs<Mutation>, "secret">
) {
  return fetchMutation(mutation, addSecret(args) as FunctionArgs<Mutation>);
}

function maybeUserFromDB(user: Doc<"users"> | null) {
  if (user === null) return null;
  return userFromDB(user);
}

function userFromDB(user: Doc<"users">) {
  return {
    ...user,
    id: user._id,
    emailVerified: maybeDate(user.emailVerified),
  };
}

function maybeSessionFromDB(session: Doc<"sessions"> | null) {
  if (session === null) return null;
  return sessionFromDB(session);
}

function sessionFromDB(session: Doc<"sessions">) {
  return {
    ...session,
    expires: new Date(session.expires),
  };
}

function maybeVerificationTokenFromDB(
  verificationToken: Doc<"verificationTokens"> | null
) {
  if (verificationToken === null) return null;
  return verificationTokenFromDB(verificationToken);
}

function verificationTokenFromDB(
  verificationToken: Doc<"verificationTokens">
) {
  return {
    ...verificationToken,
    expires: new Date(verificationToken.expires),
  };
}

function maybeDate(value: number | undefined) {
  return value === undefined ? null : new Date(value);
}

function toDB<T extends object>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const value = obj[key as keyof T];
    result[key] =
      value instanceof Date
        ? value.getTime()
        : value === null
          ? undefined
          : value;
  }
  return result;
}

function accountFromDB(account: Doc<"accounts">): AdapterAccount {
  const { _id, _creationTime, ...rest } = account;
  return {
    ...rest,
    userId: account.userId as unknown as string,
  } as AdapterAccount;
}

function maybeAccountFromDB(account: Doc<"accounts"> | null): AdapterAccount | null {
  if (account === null) return null;
  return accountFromDB(account);
}

export const ConvexAdapter: Adapter = {
  async createAuthenticator(authenticator: Authenticator) {
    await callMutation(api.authAdapter.createAuthenticator, {
      authenticator: toDB(authenticator) as Doc<"authenticators">,
    });
    return authenticator;
  },

  async createSession(session: Session) {
    const id = await callMutation(api.authAdapter.createSession, {
      session: toDB(session) as Doc<"sessions">,
    });
    return { ...session, id };
  },

  async createUser(user: User) {
    const { id: _, ...data } = user;
    const id = await callMutation(api.authAdapter.createUser, {
      user: toDB(data) as Omit<Doc<"users">, "_id">,
    });
    return { ...user, id };
  },

  async createVerificationToken(verificationToken: VerificationToken) {
    await callMutation(api.authAdapter.createVerificationToken, {
      verificationToken: toDB(verificationToken) as Doc<"verificationTokens">,
    });
    return verificationToken;
  },

  async deleteSession(sessionToken: string) {
    return maybeSessionFromDB(
      await callMutation(api.authAdapter.deleteSession, { sessionToken })
    );
  },

  async deleteUser(id: Id<"users">) {
    return maybeUserFromDB(
      await callMutation(api.authAdapter.deleteUser, { id })
    );
  },

  async getAccount(providerAccountId: string, provider: string) {
    const row = await callQuery(api.authAdapter.getAccount, {
      provider,
      providerAccountId,
    });
    return maybeAccountFromDB(row);
  },

  async getAuthenticator(credentialID: string) {
    return (await callQuery(api.authAdapter.getAuthenticator, {
      credentialID,
    })) as Doc<"authenticators"> | null;
  },

  async getSessionAndUser(sessionToken: string) {
    const result = await callQuery(api.authAdapter.getSessionAndUser, {
      sessionToken,
    });
    if (result === null) return null;
    const { user, session } = result;
    return {
      user: userFromDB(user),
      session: sessionFromDB(session),
    };
  },

  async getUser(id: Id<"users">) {
    return maybeUserFromDB(
      await callQuery(api.authAdapter.getUser, { id })
    );
  },

  async getUserByAccount({
    provider,
    providerAccountId,
  }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
    return maybeUserFromDB(
      await callQuery(api.authAdapter.getUserByAccount, {
        provider,
        providerAccountId,
      })
    );
  },

  async getUserByEmail(email: string) {
    return maybeUserFromDB(
      await callQuery(api.authAdapter.getUserByEmail, { email })
    );
  },

  async linkAccount(account: Account) {
    await callMutation(api.authAdapter.linkAccount, {
      account: toDB(account) as unknown as Doc<"accounts">,
    });
  },

  async listAuthenticatorsByUserId(userId: Id<"users">) {
    return (await callQuery(api.authAdapter.listAuthenticatorsByUserId, {
      userId,
    })) as Doc<"authenticators">[];
  },

  async unlinkAccount({
    provider,
    providerAccountId,
  }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
    const result = await callMutation(api.authAdapter.unlinkAccount, {
      provider,
      providerAccountId,
    });
    return result ?? undefined;
  },

  async updateAuthenticatorCounter(credentialID: string, newCounter: number) {
    return (await callMutation(api.authAdapter.updateAuthenticatorCounter, {
      credentialID,
      newCounter,
    })) as Doc<"authenticators">;
  },

  async updateSession(session: Partial<Session> & Pick<Session, "sessionToken">) {
    const payload = toDB(session);
    await callMutation(api.authAdapter.updateSession, {
      session: {
        sessionToken: payload.sessionToken as string,
        expires: (payload.expires as number) ?? 0,
      },
    });
    return undefined;
  },

  async updateUser(user: User) {
    await callMutation(api.authAdapter.updateUser, {
      user: toDB(user) as Doc<"users"> & { id: Id<"users"> },
    });
    return user;
  },

  async useVerificationToken({
    identifier,
    token,
  }: {
    identifier: string;
    token: string;
  }) {
    return maybeVerificationTokenFromDB(
      await callMutation(api.authAdapter.useVerificationToken, {
        identifier,
        token,
      })
    );
  },
};
