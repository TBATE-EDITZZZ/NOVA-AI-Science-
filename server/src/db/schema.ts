import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const id = (name = "id") => varchar(name, { length: 36 });
const createdAt = () => datetime("created_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`);
const updatedAt = () => datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`);

/** Local application profile. Authentication secrets and provider tokens are deliberately not stored. */
export const users = mysqlTable(
  "users",
  {
    id: id().primaryKey(),
    displayName: varchar("display_name", { length: 160 }),
    email: varchar("email", { length: 320 }),
    avatarUrl: varchar("avatar_url", { length: 2048 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("users_email_uq").on(table.email)],
);

/** Provider identity linkage only: never persist access/refresh tokens or credentials here. */
export const oauthAccounts = mysqlTable(
  "oauth_accounts",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 40 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("oauth_provider_account_uq").on(table.provider, table.providerAccountId),
    index("oauth_user_idx").on(table.userId),
  ],
);

/** Opaque application sessions; only a SHA-256 digest of the bearer token is stored. */
export const sessions = mysqlTable(
  "sessions",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("sessions_token_hash_uq").on(table.tokenHash), index("sessions_user_idx").on(table.userId), index("sessions_expires_idx").on(table.expiresAt)],
);

export const chats = mysqlTable(
  "chats",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New chat"),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("chats_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const messages = mysqlTable(
  "messages",
  {
    id: id().primaryKey(),
    chatId: id("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 24 }).notNull(),
    content: text("content").notNull(),
    model: varchar("model", { length: 120 }),
    metadata: json("metadata").$type<Record<string, unknown> | null>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("messages_chat_created_idx").on(table.chatId, table.createdAt)],
);

export const collections = mysqlTable(
  "collections",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("collections_user_name_idx").on(table.userId, table.name)],
);

export const bookmarks = mysqlTable(
  "bookmarks",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    collectionId: id("collection_id").references(() => collections.id, { onDelete: "set null" }),
    url: varchar("url", { length: 2048 }).notNull(),
    title: varchar("title", { length: 512 }),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("bookmarks_user_created_idx").on(table.userId, table.createdAt), index("bookmarks_collection_idx").on(table.collectionId)],
);

export const researchNotes = mysqlTable(
  "research_notes",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("research_notes_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const researchReferences = mysqlTable(
  "research_references",
  {
    id: id().primaryKey(),
    noteId: id("note_id").notNull().references(() => researchNotes.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 2048 }).notNull(),
    title: varchar("title", { length: 512 }),
    citation: text("citation"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("research_references_note_idx").on(table.noteId)],
);

export const learningProgress = mysqlTable(
  "learning_progress",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    topicKey: varchar("topic_key", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("not_started"),
    progressPercent: int("progress_percent", { unsigned: true }).notNull().default(0),
    details: json("details").$type<Record<string, unknown> | null>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("learning_user_topic_uq").on(table.userId, table.topicKey)],
);

export const projects = mysqlTable(
  "projects",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("projects_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const communityPosts = mysqlTable(
  "community_posts",
  {
    id: id().primaryKey(),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    visibility: varchar("visibility", { length: 24 }).notNull().default("public"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("community_posts_created_idx").on(table.createdAt), index("community_posts_user_idx").on(table.userId)],
);

export const communityComments = mysqlTable(
  "community_comments",
  {
    id: id().primaryKey(),
    postId: id("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("community_comments_post_created_idx").on(table.postId, table.createdAt), index("community_comments_user_idx").on(table.userId)],
);


/** Explicitly synced browser workspace snapshot; JSON remains scoped to its authenticated owner. */
export const workspaceSnapshots = mysqlTable("workspace_snapshots", {
  userId: id("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  state: json("state").$type<Record<string, string>>().notNull(),
  updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
