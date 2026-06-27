import {
  Sparkles, CalendarCheck, Building2, Gauge, Palette, Smartphone, Search, Globe, Globe2,
  Check, ArrowRight, ArrowUpRight, ArrowLeft, ArrowUp, Paperclip, Mic, Menu, X, Moon, Sun,
  Languages, Quote, Eye, Heart, Share2, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Minus, Star, Zap, ShieldCheck, Users, ChevronsLeftRight, MoveHorizontal,
  Stethoscope, Scissors, Scale, GraduationCap, Sofa, Home, MessageCircle, Phone,
  PencilRuler, LayoutTemplate, Rocket, MousePointerClick, Bot, Wand2, Play, Clock,
  TrendingUp, BadgeCheck, Layers, CircleDot, Target, Sparkle, Loader2, Github, Settings,
  Monitor, Tablet,
  // Icons used in builder / dashboard — added to avoid Sparkles fallback
  ExternalLink, Maximize2, Minimize2,
  Image, Type, Video,
  GripVertical, PanelLeftOpen, PanelLeftClose,
  Expand, Shrink,
  UploadCloud, Upload, Pencil, Pipette, Trash2, Copy, ArrowDown, Undo2, Redo2, ChevronUp, GalleryVerticalEnd,
  // Site-builder content icons (Safe Icon List)
  Coffee, Utensils, ShoppingBag, Dumbbell, MapPin, Mail, Leaf, Award, Truck, Camera, Calendar,
  // Onboarding checklist + UI
  LayoutGrid, HelpCircle, Megaphone, BarChart3, Tag, CheckCircle2, Lock,
  // Booking simulator (chat UI + appointments)
  Send, User, RotateCcw, CalendarClock, CircleAlert,
  // Booking dashboard tabs + invoicing
  CalendarDays, UserX, ReceiptText, Settings2, QrCode,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  Sparkles, CalendarCheck, Building2, Gauge, Palette, Smartphone, Search, Globe, Globe2,
  Check, ArrowRight, ArrowUpRight, ArrowLeft, ArrowUp, Paperclip, Mic, Menu, X, Moon, Sun,
  Languages, Quote, Eye, Heart, Share2, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Minus, Star, Zap, ShieldCheck, Users, ChevronsLeftRight, MoveHorizontal,
  Stethoscope, Scissors, Scale, GraduationCap, Sofa, Home, MessageCircle, Phone,
  PencilRuler, LayoutTemplate, Rocket, MousePointerClick, Bot, Wand2, Play, Clock,
  TrendingUp, BadgeCheck, Layers, CircleDot, Target, Sparkle, Loader2, Github, Settings,
  Monitor, Tablet,
  ExternalLink, Maximize2, Minimize2,
  Image, Type, Video,
  GripVertical, PanelLeftOpen, PanelLeftClose,
  Expand, Shrink,
  UploadCloud, Upload, Pencil, Pipette, Trash2, Copy, ArrowDown, Undo2, Redo2, ChevronUp, GalleryVerticalEnd,
  Coffee, Utensils, ShoppingBag, Dumbbell, MapPin, Mail, Leaf, Award, Truck, Camera, Calendar,
  LayoutGrid, HelpCircle, Megaphone, BarChart3, Tag, CheckCircle2, Lock,
  Send, User, RotateCcw, CalendarClock, CircleAlert,
  CalendarDays, UserX, ReceiptText, Settings2, QrCode,
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
  const Cmp = registry[name];
  if (!Cmp) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Icon] unknown icon: "${name}" — falling back to Sparkles`);
    }
    const Fallback = registry.Sparkles;
    return <Fallback className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
