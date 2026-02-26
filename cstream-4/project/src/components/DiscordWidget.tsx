import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DISCORD_INVITE = "https://discord.gg/YSkhZubt3y";
const GUILD_ID = "1444692903439110229";
const WIDGET_URL = `https://discord.com/api/guilds/${GUILD_ID}/widget.json`;
const GOAL = 1500;

export const DiscordWidget = () => {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [online, setOnline] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [members, setMembers] = useState<any[]>([]);

  const t = {
    fr: {
      subtitle: "Rejoignez l'élite",
      online: "En ligne",
      members: "Membres",
      goalText: "Objectif",
      footer: "Actif 24/7",
      join: "REJOINDRE",
      note: "Accès gratuit",
    },
    en: {
      subtitle: "Join the elite",
      online: "Online",
      members: "Members",
      goalText: "Goal",
      footer: "Active 24/7",
      join: "JOIN",
      note: "Free access",
    },
  }[lang];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(WIDGET_URL);
        const data = await res.json();

        setOnline(data.presence_count ?? 0);
        setTotal(data.members?.length ?? 0);
        setMembers(data.members?.slice(0, 5) ?? []);
      } catch (err) {
        console.error("Erreur Discord API :", err);
      }
    };

    load();
  }, []);

  const progress = Math.min((total / GOAL) * 100, 100);

  return (
    <div className="w-full max-w-[360px] mx-auto bg-[#0a0c14]/90 border border-white/10 rounded-2xl p-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_12px_rgba(76,111,255,0.4)] bg-[#0a0b12]">
              <img
                src="https://share.creavite.co/697a3798bab97f02c66bd91c.gif"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4cffb3] border-2 border-[#0a0c14] shadow-[0_0_8px_rgba(76,255,179,0.5)]" />
          </div>

          <div>
            <h2 className="text-sm font-black text-white">CStream</h2>
            <p className="text-[10px] text-zinc-400">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col items-end text-xs font-bold gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cffb3] animate-pulse" />
            <span className="text-white">{online}</span>
            <span className="text-zinc-500">{t.online}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-zinc-500" />
            <span className="text-white">{total}</span>
            <span className="text-zinc-500">{t.members}</span>
          </div>
        </div>
      </div>

      {/* PROGRESSION */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
          <span className="text-zinc-400">{t.goalText}</span>
          <span className="text-white">
            {total} / {GOAL}
          </span>
        </div>

        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#4c6fff] to-[#7a8dff] rounded-full"
          />
        </div>
      </div>

      {/* AVATARS */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {members.map((m, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-[#0a0c14] overflow-hidden"
            >
              <img src={m.avatar_url} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider italic">
          {t.footer}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-2">
        <a
          href={DISCORD_INVITE}
          target="_blank"
          className="flex-1 bg-[#4c6fff] hover:bg-[#5a7dff] text-white text-[9px] font-black uppercase tracking-[0.15em] py-2 rounded-xl text-center shadow-[0_10px_25px_rgba(76,111,255,0.4)] transition-all hover:-translate-y-0.5 active:scale-95"
        >
          {t.join}
        </a>

        <div className="flex gap-1">
          {["fr", "en"].map((lng) => (
            <button
              key={lng}
              onClick={() => setLang(lng as any)}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-all border",
                lang === lng
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400",
              )}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          {t.note}
        </span>
      </div>
    </div>
  );
};
