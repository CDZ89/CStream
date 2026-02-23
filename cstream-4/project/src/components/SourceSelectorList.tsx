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

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {SOURCES.map((source, index) => {
                    const isSelected = currentSource === source.id;
                    return (
                        <motion.button
                            key={source.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.01 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(source.id)}
                            className={cn(
                                "relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 border overflow-hidden",
                                isSelected
                                    ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/10"
                                    : "bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-800/60"
                            )}
                        >
                            {/* Selected Glow */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 animate-pulse" />
                            )}

                            {/* Icon Container */}
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-all text-lg",
                                isSelected ? "bg-purple-500 shadow-lg" : "bg-white/5 group-hover:bg-white/10"
                            )}>
                                <span>{source.icon || '🎬'}</span>
                            </div>

                            {/* Source Name */}
                            <span className={cn(
                                "text-[10px] font-bold text-center truncate w-full px-1",
                                isSelected ? "text-white" : "text-white/60 group-hover:text-white"
                            )}>
                                {source.name}
                            </span>

                            {/* Reliable indicator */}
                            {source.reliable && !isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            )}

                            {/* Checkmark for selection */}
                            {isSelected && (
                                <div className="absolute top-1 right-1">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
