/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { expiryStatus } from '../lib/expiry.js';

const FridgeContext = createContext(null);

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: state still works for this session */
    }
  }, [key, value]);
  return [value, setValue];
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export function FridgeProvider({ children }) {
  // Fridge item: { id, name, expiry: 'yyyy-MM-dd' | '', addedAt }
  const [fridge, setFridge] = useLocalStorage('fs-fridge', []);
  // Cooked log entry: { id, date, mealId, mealName, thumb, items: [{name, status}] }
  const [log, setLog] = useLocalStorage('fs-log', []);

  const addItem = (name, expiry) =>
    setFridge((f) => [...f, { id: newId(), name: name.trim(), expiry: expiry || '', addedAt: new Date().toISOString() }]);

  const removeItem = (id) => setFridge((f) => f.filter((i) => i.id !== id));

  /** Log a cooked meal and remove the used items from the fridge. */
  const logCooked = (meal, usedItems) => {
    const entry = {
      id: newId(),
      date: new Date().toISOString(),
      mealId: meal.idMeal,
      mealName: meal.strMeal,
      thumb: meal.strMealThumb,
      items: usedItems.map((i) => ({ name: i.name, status: expiryStatus(i.expiry) })),
    };
    setLog((l) => [entry, ...l]);
    const usedIds = new Set(usedItems.map((i) => i.id));
    setFridge((f) => f.filter((i) => !usedIds.has(i.id)));
    return entry;
  };

  const removeLogEntry = (id) => setLog((l) => l.filter((e) => e.id !== id));

  return (
    <FridgeContext.Provider value={{ fridge, addItem, removeItem, log, logCooked, removeLogEntry }}>
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error('useFridge must be used inside <FridgeProvider>');
  return ctx;
}
