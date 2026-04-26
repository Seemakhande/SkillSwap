import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Check } from 'lucide-react';

const SkillPicker = ({ selected = [], onChange, available = [], accent = 'emerald', placeholder = 'Add a skill...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lowerSelected = selected.map(s => s.toLowerCase());
  const catalogueNames = available.map(s => (typeof s === 'string' ? s : s.name));

  const filtered = catalogueNames
    .filter(name => name.toLowerCase().includes(query.toLowerCase()))
    .sort();

  const isExactMatch = query && catalogueNames.some(n => n.toLowerCase() === query.toLowerCase());
  const canAddCustom = query.trim().length > 0 && !isExactMatch && !lowerSelected.includes(query.trim().toLowerCase());

  const toggle = (name) => {
    const lower = name.toLowerCase();
    if (lowerSelected.includes(lower)) {
      onChange(selected.filter(s => s.toLowerCase() !== lower));
    } else {
      onChange([...selected, name]);
    }
  };

  const remove = (name) => {
    onChange(selected.filter(s => s !== name));
  };

  const addCustom = () => {
    const clean = query.trim();
    if (!clean) return;
    if (!lowerSelected.includes(clean.toLowerCase())) onChange([...selected, clean]);
    setQuery('');
  };

  const accentClasses = {
    emerald: {
      chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      ring: 'focus:border-emerald-500 focus:ring-emerald-500',
      icon: 'text-emerald-400',
      active: 'bg-emerald-500/20 text-emerald-300',
      btn: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    },
    blue: {
      chip: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      ring: 'focus:border-blue-500 focus:ring-blue-500',
      icon: 'text-blue-400',
      active: 'bg-blue-500/20 text-blue-300',
      btn: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
    }
  };
  const a = accentClasses[accent] || accentClasses.emerald;

  return (
    <div ref={ref} className="relative space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selected.length === 0 && (
          <span className="text-xs text-slate-500 italic py-1">No skills selected yet.</span>
        )}
        {selected.map((s, i) => (
          <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${a.chip}`}>
            {s}
            <button
              type="button"
              onClick={() => remove(s)}
              className="hover:text-white transition-colors -mr-0.5"
              aria-label={`Remove ${s}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); if (canAddCustom) addCustom(); }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={placeholder}
            className={`w-full bg-slate-800/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all ${a.ring}`}
          />
        </div>

        {open && (
          <div className="absolute left-0 right-0 mt-1 z-50 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl shadow-black/70 max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-white/5">
            {filtered.length === 0 && !canAddCustom && (
              <p className="p-3 text-xs text-slate-500 text-center">No matches in catalogue.</p>
            )}
            {filtered.slice(0, 50).map((name, i) => {
              const isChecked = lowerSelected.includes(name.toLowerCase());
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggle(name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${isChecked ? a.active : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>{name}</span>
                  {isChecked && <Check className={`h-4 w-4 ${a.icon}`} />}
                </button>
              );
            })}
            {canAddCustom && (
              <button
                type="button"
                onClick={addCustom}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-t border-slate-700 font-medium transition-colors ${a.btn}`}
              >
                <Plus className="h-4 w-4" /> Add "{query.trim()}" as a new skill
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillPicker;
