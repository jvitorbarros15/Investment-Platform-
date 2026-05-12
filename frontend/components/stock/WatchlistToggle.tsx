"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWatchlistItem, deleteWatchlistItem } from "@/lib/api";

interface WatchlistToggleProps {
  ticker: string;
  watchlistItemId: string | null;
}

export function WatchlistToggle({ ticker, watchlistItemId }: WatchlistToggleProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState<string | null>(watchlistItemId);
  const inWatchlist = itemId !== null;

  const add = useMutation({
    mutationFn: () => addWatchlistItem({ ticker }),
    onSuccess: (data) => {
      setItemId(data.id);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteWatchlistItem(itemId!),
    onSuccess: () => {
      setItemId(null);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const isPending = add.isPending || remove.isPending;

  return (
    <button
      onClick={() => (inWatchlist ? remove.mutate() : add.mutate())}
      disabled={isPending}
      title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      style={{
        width: 32, height: 32, borderRadius: 6,
        border: inWatchlist
          ? "1px solid rgba(201,247,111,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        background: inWatchlist ? "rgba(201,247,111,0.12)" : "#14130f",
        cursor: isPending ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: isPending ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill={inWatchlist ? "#c9f76f" : "none"}
        stroke={inWatchlist ? "#c9f76f" : "rgba(245,241,232,0.6)"} strokeWidth="2"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
