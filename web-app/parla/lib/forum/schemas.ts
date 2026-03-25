import { z } from "zod/v4";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = any;

export const threadCreateSchema: AnySchema = z.object({
  category_id: z.string().min(1, "Select a category"),
  title: z.string().min(1, "Title is required").max(300, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  tags: z.string().optional(),
});

export type ThreadCreateFormData = {
  category_id: string;
  title: string;
  content: string;
  tags?: string;
};

export const threadUpdateSchema: AnySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title is too long")
    .optional(),
  content: z.string().min(1, "Content is required").optional(),
  tags: z.string().optional(),
});

export type ThreadUpdateFormData = {
  title?: string;
  content?: string;
  tags?: string;
};

export const replyCreateSchema: AnySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

export type ReplyCreateFormData = {
  content: string;
};

export const replyUpdateSchema: AnySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

export type ReplyUpdateFormData = {
  content: string;
};
