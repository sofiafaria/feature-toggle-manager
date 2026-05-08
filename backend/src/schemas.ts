import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const ItemSchema = z.object({
  serviceName: z.string().min(1),
  apiName: z.string().min(1),
  method: z.string().min(1),
  urlTemplate: z.string().min(1),
});

export const ToggleBatchSchema = z.object({
  items: z.array(ItemSchema).min(1),
  contextId: z.string().min(1),
  user: z.string().min(1),
  contextDisplayName: z.string().min(1),
});

export const BulkByTagSchema = z.object({
  serviceName: z.string().min(1),
  tagNames: z.array(z.string()).min(1),
  action: z.enum(["block", "unblock"]),
  contextId: z.string().min(1),
  user: z.string().min(1),
  contextDisplayName: z.string().min(1),
});

export const UpdateEndpointSchema = z.object({
  url: z.string().url(),
  user: z.string().min(1),
  contextDisplayName: z.string().min(1),
});

export const TestConnectionSchema = z.object({
  url: z.string().url(),
});

export const ContextChangeSchema = z.object({
  user: z.string().min(1),
  contextDisplayName: z.string().min(1),
});
