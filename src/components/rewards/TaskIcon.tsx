import { 
  CheckCircle2, 
  Eye, 
  Target, 
  Users, 
  Share2,
  Gift,
  Star,
  Trophy,
  Sparkles,
  Zap,
  Coins,
  UserPlus,
  Rocket,
  Medal,
  Crown,
  Flame,
  MessageCircle,
  Link,
  type LucideIcon
} from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";

// Icon name to Lucide component mapping for tasks
const iconMap: Record<string, LucideIcon> = {
  // Task-specific icons
  "check-circle": CheckCircle2,
  "eye": Eye,
  "target": Target,
  "users": Users,
  "share": Share2,
  "x": XIcon as unknown as LucideIcon,
  "user-plus": UserPlus,
  "message-circle": MessageCircle,
  "link": Link,
  
  // Rewards & Engagement icons
  "gift": Gift,
  "star": Star,
  "trophy": Trophy,
  "sparkles": Sparkles,
  "zap": Zap,
  "coins": Coins,
  "rocket": Rocket,
  "medal": Medal,
  "crown": Crown,
  "flame": Flame,
  
  // Fallback aliases (for legacy emoji-based icons)
  "✅": CheckCircle2,
  "👀": Eye,
  "🎯": Target,
  "👥": Users,
  "🐦": XIcon as unknown as LucideIcon,
};

interface TaskIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export const TaskIcon = ({ icon, className = "", size = 20 }: TaskIconProps) => {
  const IconComponent = iconMap[icon];
  
  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }
  
  // Fallback: render as emoji if no icon found
  return <span className={className}>{icon}</span>;
};

// Export the icon map for reference in Style Guide
export const taskIconNames = Object.keys(iconMap).filter(key => !key.startsWith("✅") && !key.startsWith("👀") && !key.startsWith("🎯") && !key.startsWith("👥") && !key.startsWith("🐦"));
