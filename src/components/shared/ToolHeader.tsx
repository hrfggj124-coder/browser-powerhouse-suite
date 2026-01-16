import { motion } from "framer-motion";
import { LucideIcon, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const ToolHeader = ({ title, description, icon: Icon, color }: ToolHeaderProps) => {
  return (
    <div className="mb-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tools
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div
          className="icon-badge shrink-0"
          style={{ backgroundColor: `hsl(var(${color}) / 0.2)` }}
        >
          <Icon className="w-6 h-6" style={{ color: `hsl(var(${color}))` }} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ToolHeader;
