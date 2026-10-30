import React, { useState } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Hand,
  CircleDot,
  Plus,
  Send,
  Sparkles,
  Mail,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { VoteType } from '../../types';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { useHaptics } from '../../hooks';
import { sendEmailWithGmail } from '../../utils/googleWorkspace';
import { formatConsensusInviteForWhatsApp, openWhatsApp } from '../../utils/whatsapp';

export const ConsensusHub: React.FC = () => {
  const { db, castVote, addComment, createProposal, activePersona } = useApp();
  const { actionSuccess, celebrate, warning, medium, light } = useHaptics();

  const [selectedPropId, setSelectedPropId] = useState<string>(db.proposals[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Objection modal
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [objectionText, setObjectionText] = useState('');

  const activeProposal = db.proposals.find((p) => p.id === selectedPropId) || db.proposals[0];

  const handleEmailDecision = async () => {
    if (!activeProposal) return;
    setIsSendingEmail(true);
    try {
      const targetEmail = activePersona.email || 'ryanpcowan@gmail.com';
      await sendEmailWithGmail({
        to: targetEmail,
        subject: `[Consensus Decision] ${activeProposal.title}`,
        bodyText: `Hello!\n\nConsensus Proposal: ${activeProposal.title}\nStatus: ${activeProposal.status.toUpperCase()}\nRule: ${activeProposal.decisionRule.toUpperCase()}\n\nSummary:\n${activeProposal.description}\n\nVotes:\n${Object.values(activeProposal.votes || {}).map(v => `- ${v.userName}: ${v.vote.toUpperCase()}`).join('\n')}\n\nSent from Big Button Life Hub via Gmail.`,
      });
      setToastMsg(`✉️ Decision summary emailed via Gmail to ${targetEmail}!`);
      playSound.complete();
      celebrate();
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      setToastMsg(err?.message || 'Email dispatch failed. Check Google Sign-in in Admin Setup.');
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShareWhatsAppInvite = () => {
    if (!activeProposal) return;
    const text = formatConsensusInviteForWhatsApp({
      title: activeProposal.title,
      description: activeProposal.description,
      decisionRule: activeProposal.decisionRule,
      deadline: activeProposal.deadline,
    });
    openWhatsApp(text);
    playSound.pop();
  };

  const handleVote = async (vote: VoteType) => {
    if (!activeProposal) return;
    if (vote === 'object') {
      warning();
      setObjectionOpen(true);
      return;
    }
    await castVote(activeProposal.id, vote);
    if (vote === 'agree') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      celebrate();
    } else if (vote === 'discuss') {
      medium();
    } else {
      light();
    }
  };

  const submitObjection = async () => {
    if (!activeProposal || !objectionText.trim()) return;
    await castVote(activeProposal.id, 'object', objectionText.trim());
    warning();
    setObjectionText('');
    setObjectionOpen(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    createProposal({
      title: newTitle.trim(),
      description: newDesc.trim(),
      ownerId: activePersona.id,
      ownerName: activePersona.name,
      deadline: '2026-11-10',
      decisionRule: 'consent',
      minQuorumCount: 2,
      eligibleVoterIds: ['user_owner', 'user_sarah', 'user_alex', 'user_sipho'],
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    actionSuccess();
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeProposal) return;
    addComment(activeProposal.id, commentInput.trim());
    triggerHaptic.pop();
    setCommentInput('');
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header Banner */}
      <div className="bg-pink-300 rounded-[32px] p-5 chunky-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🗳️</span>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase leading-none">THE BIG VOTE!</h2>
            <p className="text-xs font-black text-slate-900 mt-1">Vote YES, NO, or CHAT with the team!</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-3 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-2xl chunky-btn flex items-center gap-1.5"
        >
          <Plus className="w-5 h-5 stroke-[3.5]" />
          <span>NEW IDEA</span>
        </button>
      </div>

      {/* Proposal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {db.proposals.map((prop) => {
          const isSelected = activeProposal && prop.id === activeProposal.id;
          return (
            <button
              key={prop.id}
              onClick={() => {
                setSelectedPropId(prop.id);
                playSound.tap();
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 border-3 border-slate-900 flex items-center gap-2 transition ${
                isSelected
                  ? 'bg-pink-400 text-slate-950 shadow-[3px_3px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white hover:bg-pink-50 text-slate-800'
              }`}
            >
              <span>{prop.status === 'open' ? '🗳️' : '🏆'}</span>
              <span className="max-w-[150px] truncate">{prop.title}</span>
            </button>
          );
        })}
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-200 border-3 border-slate-900 rounded-2xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="font-bold text-slate-700">✕</button>
        </div>
      )}

      {/* Main Active Decision Card */}
      {activeProposal && (
        <div className="bg-white rounded-[32px] p-5 sm:p-6 border-3.5 border-slate-900 shadow-[5px_5px_0px_#0f172a] space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 bg-yellow-200 text-[10px] font-black uppercase rounded-lg border-2 border-slate-900">
                {activeProposal.status === 'open' ? 'VOTING OPEN' : '🏆 DECIDED!'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleEmailDecision}
                  disabled={isSendingEmail}
                  className="chunky-btn px-2.5 py-1.5 rounded-xl border-2 border-slate-900 bg-rose-200 hover:bg-rose-300 text-slate-900 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000] disabled:opacity-50"
                  title="Send Decision Summary via Gmail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gmail</span>
                </button>
                <button
                  onClick={handleShareWhatsAppInvite}
                  className="chunky-btn px-2.5 py-1.5 rounded-xl border-2 border-slate-900 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                  title="Share Vote Invite via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
              {activeProposal.title}
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Suggested by {activeProposal.ownerName}
            </p>
          </div>

          {/* Description */}
          <div className="p-4 bg-amber-50 rounded-2xl border-3 border-slate-900 text-sm font-bold text-slate-900">
            {activeProposal.description}
          </div>

          {/* 4 ENORMOUS VOTING TILES */}
          {activeProposal.status === 'open' ? (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-700 block">
                Tap Your Big Vote (as {activePersona.name.split(' ')[0]}):
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. AGREE */}
                <button
                  onClick={() => handleVote('agree')}
                  className="min-h-[82px] p-3 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-lg rounded-3xl chunky-btn flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                >
                  <ThumbsUp className="w-8 h-8 stroke-[3]" />
                  <span>👍 YES! (AGREE)</span>
                </button>

                {/* 2. DISCUSS */}
                <button
                  onClick={() => handleVote('discuss')}
                  className="min-h-[82px] p-3 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-3xl chunky-btn flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                >
                  <MessageSquare className="w-8 h-8 stroke-[3]" />
                  <span>🤔 LET'S TALK</span>
                </button>

                {/* 3. OBJECT */}
                <button
                  onClick={() => handleVote('object')}
                  className="min-h-[82px] p-3 bg-rose-400 hover:bg-rose-500 text-slate-950 font-black text-lg rounded-3xl chunky-btn flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Hand className="w-8 h-8 stroke-[3]" />
                  <span>✋ NO WAY</span>
                </button>

                {/* 4. ABSTAIN */}
                <button
                  onClick={() => handleVote('abstain')}
                  className="min-h-[82px] p-3 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-lg rounded-3xl chunky-btn flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                >
                  <CircleDot className="w-8 h-8 stroke-[3]" />
                  <span>⚪ PASS (SKIP)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-100 rounded-2xl border-3 border-slate-900 text-center space-y-1">
              <span className="text-3xl">🎉</span>
              <h4 className="text-base font-black text-slate-950">THIS IDEA WAS APPROVED!</h4>
              <p className="text-xs font-bold text-slate-700">Tasks have been added to your To-Do list!</p>
            </div>
          )}

          {/* Team Votes */}
          <div className="space-y-2 pt-2 border-t-2 border-slate-200">
            <span className="text-xs font-black uppercase text-slate-700 block">
              Team Votes:
            </span>
            <div className="space-y-1.5">
              {Object.values(activeProposal.votes).map((v) => (
                <div
                  key={v.userId}
                  className="p-3 bg-amber-50 rounded-2xl border-2 border-slate-900 flex items-center justify-between"
                >
                  <span className="text-sm font-black text-slate-950">{v.userName}</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-slate-900 ${
                      v.vote === 'agree' ? 'bg-emerald-300' : v.vote === 'object' ? 'bg-rose-300' : 'bg-yellow-200'
                    }`}
                  >
                    {v.vote.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Chat */}
          <div className="space-y-2 pt-2 border-t-2 border-slate-200">
            <span className="text-xs font-black uppercase text-slate-700 block">
              Chat & Ideas ({activeProposal.comments.length}):
            </span>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 p-3 rounded-2xl border-3 border-slate-900 text-xs font-bold bg-amber-50 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-pink-400 hover:bg-pink-500 font-black text-xs rounded-2xl chunky-btn"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Objection Reason Modal */}
      {objectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[32px] bg-amber-50 p-6 chunky-card space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-lg font-black uppercase text-slate-950">✋ Why say NO?</h3>
              <button
                onClick={() => setObjectionOpen(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-slate-700">Tell the team why you disagree:</p>
            <textarea
              rows={3}
              required
              value={objectionText}
              onChange={(e) => setObjectionText(e.target.value)}
              placeholder="e.g. Too expensive or not safe..."
              className="w-full p-3 rounded-2xl border-3 border-slate-900 text-xs font-semibold bg-white outline-none"
            />
            <button
              onClick={submitObjection}
              className="w-full py-3.5 bg-rose-400 hover:bg-rose-500 text-slate-950 font-black text-sm rounded-2xl chunky-btn"
            >
              SAVE OBJECTION
            </button>
          </div>
        </div>
      )}

      {/* New Idea Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[32px] bg-amber-50 p-6 chunky-card space-y-3.5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-lg font-black uppercase text-slate-950">💡 New Idea to Vote On</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Idea Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Buy laser cutter or order pizza"
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-sm font-bold bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Why should we do it?
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Tell your team why this is awesome..."
                  className="w-full p-3 rounded-2xl border-3 border-slate-900 text-xs font-semibold bg-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-pink-400 hover:bg-pink-500 text-slate-950 font-black text-base rounded-2xl chunky-btn"
              >
                🗳️ START THE VOTE!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
