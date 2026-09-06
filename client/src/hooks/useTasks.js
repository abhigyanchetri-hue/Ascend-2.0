// useTasks — all task data + actions for one day, in one hook.
// Components stay clean: they call addTask/toggleTask and render the result.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { todayISO } from '../utils/dateHelpers';
import { useAuth } from '../context/AuthContext';

export function useTasks(dateIso) {
  const { applyUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/tasks?date=${dateIso}`);
      setTasks(data.tasks);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateIso]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (fields) => {
    const data = await api.post('/tasks', { ...fields, date: dateIso });
    setTasks((prev) => [...prev, data.task]);
  };

  const updateTask = async (taskId, patch) => {
    const data = await api.put(`/tasks/${taskId}`, patch);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
  };

  const deleteTask = async (taskId) => {
    await api.del(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  // Ticking a task: the server awards EXP and returns the refreshed user
  // (level, streak…) plus any bonus messages for quiet feedback.
  const toggleTask = async (taskId) => {
    const data = await api.patch(`/tasks/${taskId}/complete`, { today: todayISO() });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    applyUser(data.user);
    return data;
  };

  return { tasks, loading, error, reload: load, addTask, updateTask, deleteTask, toggleTask };
}
