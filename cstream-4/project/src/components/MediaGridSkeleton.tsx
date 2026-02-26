import { motion } from 'framer-motion';

export const MediaGridSkeleton = ({ count = 20 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex flex-col gap-2"
                >
                    <div className="aspect-[2/3] w-full rounded-xl bg-secondary/30 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                    <div className="h-4 w-3/4 bg-secondary/30 rounded animate-pulse mt-1" />
                    <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse" />
                </motion.div>
            ))}
        </div>
    );
};
