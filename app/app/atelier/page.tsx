import type { Metadata } from "next";
import Link from "next/link";
import { Gift, History, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RankBadge } from "@/components/app/rank-badge";
import { ReferralCard } from "@/components/app/referral-card";
import type {
  Profile,
  RewardLedgerRow,
  ReferralRow,
} from "@/lib/supabase/types";
import {
  RANK_ORDER,
  RANK_LABELS,
  RANK_RANGE_LABEL,
  RANK_PERKS,
  REWARD_LABELS,
  rankProgress,
  type Rank,
  type RewardType,
} from "@/lib/atelier";

export const metadata: Metadata = {
  title: "L'Atelier",
  robots: { index: false, follow: false },
};

export default async function AtelierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  const { data: rewards } = await supabase
    .from("rewards_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: referrals } = await supabase
    .from("referrals")
    .select("status")
    .eq("inviter_id", user.id);

  const rewardRows = (rewards as RewardLedgerRow[] | null) ?? [];
  const referralRows = (referrals as Pick<ReferralRow, "status">[] | null) ?? [];
  const validatedCount = referralRows.filter(
    (r) => r.status === "validated",
  ).length;
  const pendingCount = referralRows.filter(
    (r) => r.status === "pending" || r.status === "accepted",
  ).length;

  const currentRank = profile.rank as Rank;
  const progress = rankProgress(profile.lifetime_minutes_used);

  const totalBonus = rewardRows.reduce(
    (sum, r) => sum + Number(r.minutes_bonus),
    0,
  );

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-7xl">
      {/* En-tête */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="annotation">§ L&apos;Atelier</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            votre progression
          </span>
        </div>
        <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900">
          Plus vous éditez, plus votre{" "}
          <span className="font-display italic font-light text-rouge-500">
            atelier
          </span>{" "}
          s&apos;agrandit.
        </h1>
      </div>

      {/* Rang actuel + progression */}
      <section className="bg-ink-900 text-ivory-50 border-2 border-ink-900 rounded-sm p-7 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <RankBadge rank={currentRank} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-rouge-400 mb-1">
              Votre rang
            </div>
            <div className="font-display italic font-light text-3xl md:text-4xl text-ivory-50 leading-none">
              {RANK_LABELS[currentRank]}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-display font-extrabold text-4xl text-ivory-50 tabular-nums leading-none">
              {profile.lifetime_minutes_used.toFixed(0)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-300 mt-1">
              min cumulées à vie
            </div>
          </div>
        </div>

        {progress.next && progress.nextThreshold !== null ? (
          <div className="mt-7">
            <div className="h-2 bg-ink-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-rouge-500 transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
              {progress.remaining.toFixed(0)} min avant{" "}
              <span className="text-rouge-400">
                {RANK_LABELS[progress.next]}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-7 font-mono text-[10px] uppercase tracking-widest text-ink-300">
            Rang maximal atteint — merci de votre fidélité.
          </p>
        )}
      </section>

      {/* Carte de parrainage */}
      {profile.referral_code && (
        <div className="mb-8">
          <ReferralCard
            code={profile.referral_code}
            validatedCount={validatedCount}
            pendingCount={pendingCount}
          />
        </div>
      )}

      {/* Les 4 rangs */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 font-display font-medium text-xl text-ink-900 mb-5">
          <TrendingUp className="h-5 w-5 text-rouge-500" aria-hidden />
          Les quatre rangs
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {RANK_ORDER.map((rank) => {
            const isCurrent = rank === currentRank;
            return (
              <article
                key={rank}
                className={
                  isCurrent
                    ? "bg-white border-2 border-rouge-500 rounded-sm p-5 shadow-[3px_3px_0_0_var(--color-rouge-500)]"
                    : "bg-white border-2 border-ink-900 rounded-sm p-5"
                }
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-ink-200">
                  <div className="flex items-center gap-2.5">
                    <RankBadge rank={rank} size="sm" />
                    <h3 className="font-display italic font-light text-xl text-ink-900 leading-none">
                      {RANK_LABELS[rank]}
                    </h3>
                  </div>
                  {isCurrent && (
                    <span className="annotation-filled text-[9px]">
                      Vous êtes ici
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3 tabular-nums">
                  {RANK_RANGE_LABEL[rank]}
                </div>
                <ul className="space-y-2 text-sm text-ink-700 leading-relaxed">
                  {RANK_PERKS[rank].map((perk, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-rouge-500 font-bold mt-0.5 select-none">
                        +
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* Historique des bonus */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="flex items-center gap-2 font-display font-medium text-xl text-ink-900">
            <History className="h-5 w-5 text-rouge-500" aria-hidden />
            Vos minutes offertes
          </h2>
          {totalBonus > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              {totalBonus.toFixed(0)} min au total
            </span>
          )}
        </div>

        {rewardRows.length === 0 ? (
          <div className="bg-ivory-100 border-2 border-dashed border-ivory-300 rounded-sm p-8 text-center">
            <div className="inline-flex h-11 w-11 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-3">
              <Gift className="h-5 w-5 text-ink-900" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
              Aucun bonus pour l&apos;instant. Vos récompenses (continuité,
              anniversaire, parrainage, cadeaux) apparaîtront ici, avec leur date
              et leur raison — en toute transparence.
            </p>
          </div>
        ) : (
          <ul className="border-2 border-ink-900 rounded-sm divide-y divide-ivory-200 overflow-hidden">
            {rewardRows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink-900">
                    {REWARD_LABELS[r.type as RewardType] ?? r.type}
                  </div>
                  <div className="text-xs text-ink-500 truncate">
                    {r.reason || "—"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="font-display font-bold text-rouge-500 tabular-nums flex-shrink-0">
                  +{Number(r.minutes_bonus).toFixed(0)} min
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Transparence */}
      <footer className="border-t border-ivory-200 pt-6">
        <p className="text-sm text-ink-500 leading-relaxed">
          L&apos;Atelier est entièrement transparent : tous les seuils et toutes
          les règles sont publics sur la{" "}
          <Link href="/atelier" className="link-pen">
            page dédiée
          </Link>
          . Les minutes offertes n&apos;expirent jamais.
        </p>
      </footer>
    </div>
  );
}
