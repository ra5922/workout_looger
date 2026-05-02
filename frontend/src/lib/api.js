import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  };
}

export async function apiFetch(path, options = {}) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Workouts
export const getWorkouts = () => apiFetch('/workouts');
export const getWorkout = (id) => apiFetch(`/workouts/${id}`);
export const createWorkout = (body) => apiFetch('/workouts', { method: 'POST', body: JSON.stringify(body) });
export const updateWorkout = (id, body) => apiFetch(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteWorkout = (id) => apiFetch(`/workouts/${id}`, { method: 'DELETE' });
export const getStats = () => apiFetch('/workouts/stats/summary');
export const duplicateWorkout = (id) => apiFetch(`/workouts/${id}/duplicate`, { method: 'POST' });

// Exercises
export const getExercises = () => apiFetch('/exercises');
export const createExercise = (body) => apiFetch('/exercises', { method: 'POST', body: JSON.stringify(body) });
