import { Check, Settings, Server, ChevronDown } from "lucide-react";
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
    const selectedSourceObj = SOURCES.find(s => s.id === currentSource) || SOURCES[0];

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-1 mb-2">
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

            <div className="relative group w-full sm:w-80">
                {/* Custom clean dropdown using standard select for mobile ease + styled wrapper */}
                <div className="relative flex items-center bg-zinc-900/80 border border-white/10 hover:border-purple-500/50 rounded-xl px-4 py-3 transition-all cursor-pointer shadow-sm shadow-purple-900/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                        <span className="text-xl shrink-0">{selectedSourceObj.icon || '🎬'}</span>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs text-white/50 font-medium uppercase tracking-wider mb-0.5">Source Actuelle</span>
                            <span className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">{selectedSourceObj.name}</span>
                        </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-white pointer-events-none transition-transform group-hover:translate-y-0.5" />

                    <select
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-zinc-900 text-white"
                        value={currentSource || SOURCES[0].id}
                        onChange={(e) => onSelect(e.target.value as PlayerSource)}
                    >
                        {SOURCES.map((source) => (
                            <option key={source.id} value={source.id} className="bg-zinc-900 text-white font-medium py-2">
                                {source.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
