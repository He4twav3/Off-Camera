import {
  Zap,
  Eye,
  Layers,
  CalendarCheck,
  Radio,
  RefreshCw,
  LayoutGrid,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per module, in curriculum order.
 *
 * In its own module, with no "use client" directive, because three
 * different components need it and they are not all on the same side of
 * the server/client boundary: the module rail and the lesson accordion
 * are client components, and the outcomes list is a server component.
 *
 * This file existing at all is the fix for a real bug. The array used to
 * be exported from module-rail.tsx, which IS a client module — and a
 * server component importing a plain value out of a client module does
 * not get the value, it gets a client reference proxy. So `MODULE_ICONS[i]`
 * resolved to undefined on the server, `<Icon />` was rendered with an
 * undefined type, and React threw "Element type is invalid" — which took
 * down the entire page render, not just the icon. Shared values that
 * cross that boundary have to live in a module that belongs to neither
 * side.
 */
export const MODULE_ICONS: LucideIcon[] = [
  Zap, // Hook
  Eye, // Retention
  Layers, // Volume
  CalendarCheck, // Consistency
  Radio, // Timing & Distribution
  RefreshCw, // Iteration
  LayoutGrid, // Content Formats
  DollarSign, // Monetization
];
