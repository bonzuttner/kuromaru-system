import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import type { RetailerData, RetailerRow } from '../types';
import { initialUiState, type UiState } from './uiTypes';

function clone<T>(o: T): T {
  const g = globalThis as unknown as { structuredClone?: <U>(v: U) => U };
  return typeof g.structuredClone === 'function' ? g.structuredClone(o) : (JSON.parse(JSON.stringify(o)) as T);
}

const LAST_RETAILER_KEY = 'kuromaru_last_retailer';
const SAVE_DEBOUNCE_MS = 600;

interface StoreValue {
  retailersLoading: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  retailers: RetailerRow[];
  retailerId: string;
  retailer: RetailerRow | null;
  data: RetailerData | null;
  ui: UiState;
  setUi: (patch: Partial<UiState>) => void;
  selectRetailer: (id: string) => void;
  addRetailer: (name: string) => Promise<RetailerRow>;
  deleteRetailer: (id: string) => Promise<void>;
  updateRetailer: (id: string, patch: Partial<RetailerRow>) => void;
  updateData: (fn: (draft: RetailerData) => void) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [retailersLoading, setRetailersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retailers, setRetailers] = useState<RetailerRow[]>([]);
  const [retailerId, setRetailerId] = useState('');
  const [data, setData] = useState<RetailerData | null>(null);
  const [ui, setUiState] = useState<UiState>(initialUiState());

  const dataSaveTimer = useRef<number | null>(null);
  const loadedDataRef = useRef<RetailerData | null>(null);
  const pendingRetailerPatches = useRef<Map<string, Partial<RetailerRow>>>(new Map());
  const retailerSaveTimer = useRef<number | null>(null);
  const loadToken = useRef(0);

  const onErr = useCallback((e: unknown) => setError(e instanceof Error ? e.message : String(e)), []);

  // initial retailer list load
  useEffect(() => {
    let cancelled = false;
    api
      .listRetailers()
      .then((list) => {
        if (cancelled) return;
        setRetailers(list);
        const last = localStorage.getItem(LAST_RETAILER_KEY);
        const initial = list.find((r) => r.id === last)?.id || list[0]?.id || '';
        setRetailerId(initial);
        setRetailersLoading(false);
        if (!initial) setLoading(false);
      })
      .catch((e) => {
        onErr(e);
        setRetailersLoading(false);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onErr]);

  // load data whenever the selected retailer changes
  useEffect(() => {
    if (!retailerId) return;
    const token = ++loadToken.current;
    setLoading(true);
    api
      .getData(retailerId)
      .then((d) => {
        if (loadToken.current !== token) return;
        loadedDataRef.current = d;
        setData(d);
        setLoading(false);
        localStorage.setItem(LAST_RETAILER_KEY, retailerId);
      })
      .catch((e) => {
        if (loadToken.current !== token) return;
        onErr(e);
        setLoading(false);
      });
  }, [retailerId, onErr]);

  // debounced autosave of the data blob whenever it's mutated locally
  useEffect(() => {
    if (!data || !retailerId) return;
    if (data === loadedDataRef.current) return; // just loaded from server, nothing to save
    const id = retailerId;
    const snapshot = data;
    if (dataSaveTimer.current) window.clearTimeout(dataSaveTimer.current);
    dataSaveTimer.current = window.setTimeout(() => {
      api.putData(id, snapshot).catch(onErr);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (dataSaveTimer.current) window.clearTimeout(dataSaveTimer.current);
    };
  }, [data, retailerId, onErr]);

  const setUi = useCallback((patch: Partial<UiState>) => setUiState((s) => ({ ...s, ...patch })), []);

  const selectRetailer = useCallback((id: string) => {
    setUiState((s) => ({ ...s, sheetIdx: 0, modal: null, csv: null, masterMenuOpen: false }));
    setRetailerId(id);
  }, []);

  const updateData = useCallback((fn: (draft: RetailerData) => void) => {
    setData((prev) => {
      if (!prev) return prev;
      const draft = clone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const updateRetailer = useCallback(
    (id: string, patch: Partial<RetailerRow>) => {
      setRetailers((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      const existing = pendingRetailerPatches.current.get(id) || {};
      pendingRetailerPatches.current.set(id, { ...existing, ...patch });
      if (retailerSaveTimer.current) window.clearTimeout(retailerSaveTimer.current);
      retailerSaveTimer.current = window.setTimeout(() => {
        const patches = pendingRetailerPatches.current;
        pendingRetailerPatches.current = new Map();
        patches.forEach((p, rid) => {
          api.updateRetailer(rid, p).catch(onErr);
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [onErr]
  );

  const addRetailer = useCallback(async (name: string) => {
    const row = await api.createRetailer(name);
    setRetailers((prev) => [...prev, row]);
    setUiState((s) => ({ ...s, nr: '', view: 'master', mtab: 'retailers' }));
    setRetailerId(row.id);
    return row;
  }, []);

  const deleteRetailer = useCallback(
    async (id: string) => {
      await api.deleteRetailer(id);
      setRetailers((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (retailerId === id && next.length) setRetailerId(next[0].id);
        return next;
      });
    },
    [retailerId]
  );

  const clearError = useCallback(() => setError(null), []);

  const retailer = useMemo(() => retailers.find((r) => r.id === retailerId) || null, [retailers, retailerId]);

  const value: StoreValue = {
    retailersLoading,
    loading,
    error,
    clearError,
    retailers,
    retailerId,
    retailer,
    data,
    ui,
    setUi,
    selectRetailer,
    addRetailer,
    deleteRetailer,
    updateRetailer,
    updateData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}
