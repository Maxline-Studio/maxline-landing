"use client";

/**
 * Historique Annuler/Rétablir de l'éditeur.
 *
 * Pile de SNAPSHOTS des cues de la langue active. `commit(avant)` est appelé
 * juste AVANT une mutation (l'appelant passe l'état courant) ; `undo(courant)`
 * rend le snapshot précédent et empile l'état courant pour `redo`. L'historique
 * est remis à zéro au changement de langue (chaque langue a ses éditions).
 */
import { useCallback, useRef, useState } from "react";
import type { Cue } from "./types";

const LIMIT = 60;

const clone = (cues: Cue[]): Cue[] => cues.map((c) => ({ ...c }));

export function useHistory() {
  const past = useRef<Cue[][]>([]);
  const future = useRef<Cue[][]>([]);
  // Compteur de version : force le re-rendu des boutons (les piles sont des refs).
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const commit = useCallback((before: Cue[]) => {
    past.current.push(clone(before));
    if (past.current.length > LIMIT) past.current.shift();
    future.current = [];
    bump();
  }, []);

  const undo = useCallback((current: Cue[]): Cue[] | null => {
    const prev = past.current.pop();
    if (!prev) return null;
    future.current.push(clone(current));
    bump();
    return prev;
  }, []);

  const redo = useCallback((current: Cue[]): Cue[] | null => {
    const next = future.current.pop();
    if (!next) return null;
    past.current.push(clone(current));
    bump();
    return next;
  }, []);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    bump();
  }, []);

  return {
    commit,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
