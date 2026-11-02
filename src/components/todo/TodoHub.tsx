import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTasks } from '../../hooks/useTRPC';
import { Priority, TaskItem } from '../../types';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { useHaptics } from '../../hooks';
import { createCalendarEvent } from '../../utils/googleWorkspace';
import { formatTaskForWhatsApp, openWhatsApp } from '../../utils/whatsapp';

const QUICK_PRESETS = [
  { emoji: '🛠️', title: 'Fix workshop gadget', cat: 'Hardware' },
  { emoji: '🥑', title: 'Buy snacks & food', cat: 'Household' },
  { emoji: '🧹', title: 'Tidy up workshop bench', cat: 'Safety' },
  { emoji: '🔋', title: 'Charge all batteries', cat: 'Hardware' },
  { emoji: '🎮', title: 'Play & tinker time', cat: 'Fun' },
];

export const TodoHub: React.FC = () => {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTask,
    deleteTask,
  } = useTasks();
  const { actionSuccess, celebrate, selection } = useHaptics();

  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'urgent' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSyncTaskToCalendar = async (task: TaskItem) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await createCalendarEvent({
        summary: task.title,
        description: task.description || `Category: ${task.category}, Priority: ${task.priority}`,
        startDate: task.dueDate || today,
      });
      setToastMsg(`📅 Synced "${task.title.slice(0, 22)}..." to Google Calendar!`);
      playSound.complete();
      celebrate();
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setToastMsg(err?.message || 'Calendar sync failed. Check Google Sign-in.');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleShareTaskWhatsApp = (task: TaskItem) => {
    const text = formatTaskForWhatsApp({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      category: task.category,
    });
    openWhatsApp(text);
    playSound.pop();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'today') return !t.completed && (t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr));
    if (filterMode === 'urgent') return !t.completed && (t.priority === 'urgent' || t.priority === 'high');
    if (filterMode === 'completed') return t.completed;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createTask({
        title: newTitle.trim(),
        completed: false,
        priority: newPriority,
        category: newCategory,
        subtasks: [],
        recurring: 'none',
        dueDate: todayStr,
      });
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      actionSuccess();
      setNewTitle('');
      setShowAddForm(false);
    } catch (err: any) {
      setToastMsg(err?.message || 'Failed to create task');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const pickPreset = (preset: { emoji: string; title: string; cat: string }) => {
    setNewTitle(`${preset.emoji} ${preset.title}`);
    setNewCategory(preset.cat);
    playSound.pop();
    selection();
  };

  const handleToggle = (taskId: string, isCompleted: boolean) => {
    toggleTask(taskId, !isCompleted);
    if (!isCompleted) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      celebrate();
    } else {
      selection();
    }
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header Banner */}
      <div className="bg-sky-400 rounded-[32px] p-5 chunky-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📝</span>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase leading-none">MY TO-DO LIST</h2>
            <p className="text-xs font-black text-slate-900 mt-1">Tap a box when you finish!</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-3 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-2xl chunky-btn flex items-center gap-1.5"
        >
          <Plus className="w-5 h-5 stroke-[3.5]" />
          <span>{showAddForm ? 'CLOSE' : 'BIG ADD'}</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 bg-amber-50 border-3 border-slate-900 rounded-2xl text-center">
          <span className="animate-pulse text-2xl">⏳</span>
          <p className="text-sm font-bold text-slate-900 mt-1">Loading tasks from hub...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-rose-100 border-3 border-slate-900 rounded-2xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_#000]">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold text-rose-700">
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-200 border-3 border-slate-900 rounded-2xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="font-bold text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Child-Simple Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-[32px] p-5 chunky-card space-y-4">
          <div className="flex items-center justify-between border-b-3 border-slate-900 pb-2">
            <span className="text-base font-black uppercase text-slate-900">What do you want to do?</span>
            <span className="text-xs font-bold text-slate-500">Pick or type:</span>
          </div>

          {/* Quick Preset Buttons for a child */}
          <div>
            <span className="text-xs font-black uppercase text-slate-700 block mb-1.5">
              Tap a quick idea:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => pickPreset(p)}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-slate-950 text-xs font-black rounded-xl border-2 border-slate-900 active:scale-95 transition"
                >
                  {p.emoji} {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Big Input */}
          <div>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Type your task here..."
              className="w-full text-lg font-black p-3.5 rounded-2xl border-3 border-slate-900 bg-amber-50 focus:bg-white outline-none"
            />
          </div>

          {/* Big Urgency Choice */}
          <div>
            <span className="text-xs font-black uppercase text-slate-700 block mb-1.5">
              How urgent is it?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewPriority('low')}
                className={`py-3 rounded-2xl border-3 border-slate-900 font-black text-xs ${
                  newPriority === 'low' ? 'bg-emerald-300 shadow-[2px_2px_0px_#0f172a]' : 'bg-slate-100'
                }`}
              >
                🟢 Later
              </button>
              <button
                type="button"
                onClick={() => setNewPriority('medium')}
                className={`py-3 rounded-2xl border-3 border-slate-900 font-black text-xs ${
                  newPriority === 'medium' ? 'bg-amber-300 shadow-[2px_2px_0px_#0f172a]' : 'bg-slate-100'
                }`}
              >
                🟡 Today
              </button>
              <button
                type="button"
                onClick={() => setNewPriority('urgent')}
                className={`py-3 rounded-2xl border-3 border-slate-900 font-black text-xs ${
                  newPriority === 'urgent' ? 'bg-rose-400 text-slate-950 shadow-[2px_2px_0px_#0f172a]' : 'bg-slate-100'
                }`}
              >
                🔴 HURRY!
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xl rounded-2xl chunky-btn"
          >
            ✅ SAVE MY TASK!
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'today', label: '⭐ Today' },
          { id: 'urgent', label: '🔴 Hurry!' },
          { id: 'completed', label: '🎉 Done' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilterMode(tab.id as any);
              playSound.tap();
              triggerHaptic.tick();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase border-3 border-slate-900 select-none transition ${
              filterMode === tab.id
                ? 'bg-sky-400 text-slate-950 shadow-[3px_3px_0px_#0f172a] -translate-y-0.5'
                : 'bg-white hover:bg-sky-50 text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chunky Task Cards */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[32px] p-8 text-center chunky-card space-y-2">
            <span className="text-5xl animate-bounce">🎈</span>
            <h3 className="text-xl font-black text-slate-900">All Done! No tasks here!</h3>
            <p className="text-xs font-bold text-slate-600">Tap "BIG ADD" to make a new one.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.completed;
            const isUrgent = task.priority === 'urgent';

            return (
              <div
                key={task.id}
                className={`\n                  p-4 rounded-[28px] border-3.5 border-slate-900 transition flex items-center justify-between gap-3.5\n                  ${isDone ? 'bg-slate-100 opacity-70 shadow-xs' : isUrgent ? 'bg-amber-100 shadow-[4px_4px_0px_#0f172a]' : 'bg-white shadow-[4px_4px_0px_#0f172a]'}\n                `}
              >
                {/* GIANT 1-TAP CHECKBOX */}
                <button
                  onClick={() => handleToggle(task.id, isDone)}
                  className={`\n                    w-14 h-14 rounded-2xl border-3 border-slate-900 flex items-center justify-center shrink-0 cursor-pointer\n                    transition active:scale-90\n                    ${isDone ? 'bg-emerald-400 text-slate-950' : 'bg-white hover:bg-yellow-200'}\n                  `}
                  title={isDone ? 'Mark not done' : 'Mark finished!'}
                >
                  {isDone ? (
                    <CheckSquare className="w-8 h-8 stroke-[3.5]" />
                  ) : (
                    <Square className="w-8 h-8 text-slate-300" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="px-2 py-0.2 bg-white text-[10px] font-black uppercase rounded-lg border border-slate-900">
                      {task.category}
                    </span>
                    {isUrgent && (
                      <span className="px-2 py-0.2 bg-rose-400 text-slate-950 text-[10px] font-black uppercase rounded-lg border border-slate-900 animate-pulse">
                        🔴 HURRY
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-base sm:text-lg font-black text-slate-950 leading-snug break-words ${
                      isDone ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Actions: Google Calendar, WhatsApp, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSyncTaskToCalendar(task)}
                    className="chunky-btn p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 border-2 border-slate-900 shadow-[1px_1px_0px_#000]"
                    title="Add to Google Calendar"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShareTaskWhatsApp(task)}
                    className="chunky-btn p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-slate-900 shadow-[1px_1px_0px_#000] text-xs font-black"
                    title="Share to WhatsApp"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => {
                      playSound.pop();
                      triggerHaptic.pop();
                      deleteTask(task.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
