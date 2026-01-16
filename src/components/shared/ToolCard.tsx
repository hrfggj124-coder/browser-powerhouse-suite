import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  delay?: number;
}

const ToolCard = ({ title, description, icon: Icon, href, color, delay = 0 }: ToolCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link to={href} className="block">
        <div className="tool-card group cursor-pointer h-full">
          <div
            className="icon-badge mb-4"
            style={{ backgroundColor: `hsl(var(${color}) / 0.2)` }}
          >
            <Icon
              className="w-6 h-6 transition-transform group-hover:scale-110"
              style={{ color: `hsl(var(${color}))` }}
            />
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: `hsl(var(${color}))` }}>
            <span>Open Tool</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ToolCard;
