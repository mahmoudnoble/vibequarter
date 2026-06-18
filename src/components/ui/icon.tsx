import {
  Sparkles, CalendarCheck, Building2, Gauge, Palette, Smartphone, Search, Globe, Globe2,
  Check, ArrowRight, ArrowUpRight, ArrowLeft, ArrowUp, Paperclip, Mic, Menu, X, Moon, Sun,
  Languages, Quote, Eye, Heart, Share2, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Minus, Star, Zap, ShieldCheck, Users, ChevronsLeftRight, MoveHorizontal,
  Stethoscope, Scissors, Scale, GraduationCap, Sofa, Home, MessageCircle, Phone,
  PencilRuler, LayoutTemplate, Rocket, MousePointerClick, Bot, Wand2, Play, Clock,
  TrendingUp, BadgeCheck, Layers, CircleDot, Target, Sparkle, Loader2, Github, Settings, Monitor, Tablet, type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  Sparkles, CalendarCheck, Building2, Gauge, Palette, Smartphone, Search, Globe, Globe2,
  Check, ArrowRight, ArrowUpRight, ArrowLeft, ArrowUp, Paperclip, Mic, Menu, X, Moon, Sun,
  Languages, Quote, Eye, Heart, Share2, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Minus, Star, Zap, ShieldCheck, Users, ChevronsLeftRight, MoveHorizontal,
  Stethoscope, Scissors, Scale, GraduationCap, Sofa, Home, MessageCircle, Phone,
  PencilRuler, LayoutTemplate, Rocket, MousePointerClick, Bot, Wand2, Play, Clock,
  TrendingUp, BadgeCheck, Layers, CircleDot, Target, Sparkle, Loader2, Github, Settings, Monitor, Tablet,
};

export function Icon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = registry[name] ?? Sparkles;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
