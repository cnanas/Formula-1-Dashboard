import { type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
