import { motion } from "framer-motion";
import { Check, Settings, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCES, type PlayerSource } from "./UniversalPlayer";

interface SourceSelectorListProps {
    currentSource: PlayerSource | undefined;
    onSelect: (sourceId: PlayerSource) => void;
    className?: string;
}

export const SourceSelectorList = ({
    currentSource,
    onSelect,
    className,
}: SourceSelectorListProps) => {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Server className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Serveurs Universels</h3>
                        <p className="text-[10px] text-white/40 font-medium lowercase">27+ sources disponibles</p>
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-4 pt-1 snap-x snap-mandatory gap-2 hide-scrollbar w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                {SOURCES.map((source, index) => {
                    const isSelected = currentSource === source.id;
                    return (
                        <motion.button
                            key={source.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelect(source.id)}
                            className={cn(
                                "relative shrink-0 group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all duration-300 border snap-start sm:snap-center",
                                isSelected
                                    ? "bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/25"
                                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            {/* Icon */}
                            <span className="text-sm sm:text-base opacity-90">{source.icon || '🎬'}</span>

                            {/* Source Name */}
                            <span className={cn(
                                "text-[10px] sm:text-xs font-bold whitespace-nowrap tracking-wide",
                                isSelected ? "text-white" : "text-white/70 group-hover:text-white"
                            )}>
                                {source.name}
                            </span>

                            {/* Checkmark for selection */}
                            {isSelected && (
                                <Check className="w-3 h-3 text-white ml-1 shrink-0" strokeWidth={3} />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
