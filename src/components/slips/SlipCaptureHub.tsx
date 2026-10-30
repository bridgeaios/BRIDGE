import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  Trash2,
  Wallet,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HardDrive,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SlipReceipt } from '../../types';
import { formatCents, parseToCents } from '../../utils/money';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { useHaptics } from '../../hooks/useHaptics';
import { uploadFileToGoogleDrive } from '../../utils/googleWorkspace';
import { formatSlipForWhatsApp, openWhatsApp } from '../../utils/whatsapp';

export const SlipCaptureHub: React.FC = () => {
  const { db, addSlip, deleteSlip, syncSlipToLedger, currency } = useApp();
  const { actionSuccess, warning } = useHaptics();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<Partial<SlipReceipt> | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [previewModalDoc, setPreviewModalDoc] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState<string | null>(null);

  const handleUploadDrive = async (slip: SlipReceipt) => {
    if (!slip.documentDataUrl) {
      setToastMsg('No image data attached to this slip.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    setIsUploadingDrive(slip.id);
    try {
      const res = await uploadFileToGoogleDrive({
        name: `${slip.merchant.replace(/\s+/g, '_')}_${slip.date}.jpg`,
        mimeType: slip.documentType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        base64Data: slip.documentDataUrl,
      });
      setToastMsg(`📁 Uploaded to Google Drive! File ID: ${res.fileId}`);
      playSound.complete();
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      setToastMsg(err?.message || 'Google Drive upload failed. Check Google Sign-in.');
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setIsUploadingDrive(null);
    }
  };

  const handleShareSlipWhatsApp = (slip: SlipReceipt) => {
    const text = formatSlipForWhatsApp({
      merchant: slip.merchant,
      amountCents: slip.amountCents,
      date: slip.date,
      category: slip.category,
      currency: currency.code,
    });
    openWhatsApp(text);
    playSound.pop();
  };

  // Quick camera snap or file picker trigger
  const triggerCamera = () => {
    playSound.pop();
    triggerHaptic.light();
    cameraInputRef.current?.click();
  };

  const triggerUpload = () => {
    playSound.pop();
    triggerHaptic.light();
    fileInputRef.current?.click();
  };

  // Compute a simple hash for duplicate detection
  const computeSimpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash-${Math.abs(hash)}`;
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDuplicateWarning(null);

    const isPdf = file.type === 'application/pdf';
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const fileHash = computeSimpleHash(file.name + file.size + file.lastModified);

      try {
        // Send to backend OCR
        const res = await fetch('/api/slips/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: dataUrl,
            mimeType: file.type || 'image/jpeg',
            filename: file.name,
          }),
        });

        let extracted: any = {};
        if (res.ok) {
          const json = await res.json();
          extracted = json.extracted || {};
        }

        // Duplicate check on fileHash or merchant+date+amount
        const isDuplicate = db.slips.some(
          (s) =>
            s.fileHash === fileHash ||
            (extracted.amountCents &&
              s.merchant.toLowerCase().trim() === extracted.merchant?.toLowerCase().trim() &&
              s.date === extracted.date &&
              s.amountCents === extracted.amountCents)
        );

        if (isDuplicate) {
          setDuplicateWarning(
            '⚠️ Duplicate detected: A slip with matching signature or merchant/amount was already logged in your records.'
          );
          playSound.alert();
          warning();
        } else {
          playSound.cash();
          actionSuccess();
        }

        // Open Review Screen
        setReviewDraft({
          merchant: extracted.merchant || file.name.replace(/\.[^/.]+$/, ''),
          date: extracted.date || new Date().toISOString().split('T')[0],
          amountCents: extracted.amountCents || 0,
          taxCents: extracted.taxCents || 0,
          currency: extracted.currency || currency.code,
          category: extracted.category || 'Tinkering & Gear',
          description: extracted.description || `Captured from ${file.name}`,
          documentDataUrl: dataUrl,
          documentType: isPdf ? 'pdf' : 'image',
          fileHash,
          isDuplicate,
          extractedViaOcr: extracted.source === 'gemini_ocr',
          syncedToLedger: false,
        });
      } catch (err) {
        console.error('OCR failed, offering manual review:', err);
        setReviewDraft({
          merchant: file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toISOString().split('T')[0],
          amountCents: 0,
          taxCents: 0,
          currency: currency.code,
          category: 'Tinkering & Gear',
          description: `Captured from ${file.name}`,
          documentDataUrl: dataUrl,
          documentType: isPdf ? 'pdf' : 'image',
          fileHash,
          isDuplicate: false,
          extractedViaOcr: false,
          syncedToLedger: false,
        });
      } finally {
        setIsProcessing(false);
        // Clear input value so same file can be retried if needed
        e.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async () => {
    if (!reviewDraft || !reviewDraft.merchant) return;

    await addSlip({
      merchant: reviewDraft.merchant,
      date: reviewDraft.date || new Date().toISOString().split('T')[0],
      amountCents: reviewDraft.amountCents || 0,
      taxCents: reviewDraft.taxCents || 0,
      currency: reviewDraft.currency || currency.code,
      category: reviewDraft.category || 'Tinkering & Gear',
      description: reviewDraft.description || '',
      documentDataUrl: reviewDraft.documentDataUrl,
      documentType: reviewDraft.documentType || 'image',
      fileHash: reviewDraft.fileHash || `hash-${Date.now()}`,
      isDuplicate: reviewDraft.isDuplicate || false,
      extractedViaOcr: !!reviewDraft.extractedViaOcr,
      syncedToLedger: true,
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    actionSuccess();
    setReviewDraft(null);
    setDuplicateWarning(null);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-orange-400 rounded-3xl p-5 chunky-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border-3 border-slate-900 flex items-center justify-center text-2xl shadow-xs">
            📸
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase">SLIP CAPTURE</h2>
            <p className="text-xs font-bold text-slate-800">
              Camera, Photo, or PDF • OCR Extraction • Duplicate Detection
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-amber-200 text-slate-950 text-xs font-black rounded-xl border-2 border-slate-900 self-start sm:self-center">
          {db.slips.length} Stored Slips
        </span>
      </div>

      {/* Two Big Action Buttons: Camera Snap & File Upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={triggerCamera}
          disabled={isProcessing}
          className="min-h-[82px] p-4 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-3xl chunky-btn flex items-center justify-center gap-3 text-left"
        >
          <Camera className="w-8 h-8 stroke-[2.5]" />
          <div>
            <div className="leading-tight">SNAP WITH CAMERA</div>
            <div className="text-xs font-bold text-slate-700">Phone camera high-res capture</div>
          </div>
        </button>

        <button
          onClick={triggerUpload}
          disabled={isProcessing}
          className="min-h-[82px] p-4 bg-orange-300 hover:bg-orange-400 text-slate-950 font-black text-xl rounded-3xl chunky-btn flex items-center justify-center gap-3 text-left"
        >
          <Upload className="w-8 h-8 stroke-[2.5]" />
          <div>
            <div className="leading-tight">UPLOAD PHOTO / PDF</div>
            <div className="text-xs font-bold text-slate-700">Gallery receipt, invoice, slip</div>
          </div>
        </button>
      </div>

      {/* Loading state indicator */}
      {isProcessing && (
        <div className="bg-white rounded-3xl p-6 chunky-card text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600" />
          <h3 className="text-base font-black text-slate-900">Processing Slip with OCR Engine...</h3>
          <p className="text-xs font-bold text-slate-600">
            Reading merchant, date, amount, VAT (15%), and line items.
          </p>
        </div>
      )}

      {/* Step 2 Review Modal: SNAP → REVIEW → CONFIRM → SAVE */}
      {reviewDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-amber-50 p-6 chunky-card max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-3 border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-xl font-black text-slate-900 uppercase">Review & Confirm Slip</h3>
              </div>
              <button
                onClick={() => setReviewDraft(null)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white font-black text-sm flex items-center justify-center shadow-xs"
              >
                ✕
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 bg-rose-200 rounded-2xl border-2 border-slate-900 text-xs font-black text-rose-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {/* Document Thumbnail Preview */}
            {reviewDraft.documentDataUrl && (
              <div className="relative rounded-2xl overflow-hidden border-3 border-slate-900 max-h-48 bg-slate-100 flex items-center justify-center">
                {reviewDraft.documentType === 'pdf' ? (
                  <div className="p-6 text-center">
                    <FileText className="w-12 h-12 text-rose-600 mx-auto" />
                    <span className="text-xs font-black text-slate-800 mt-1 block">PDF Slip Document</span>
                  </div>
                ) : (
                  <img
                    src={reviewDraft.documentDataUrl}
                    alt="Slip document"
                    className="max-h-48 object-contain w-full"
                  />
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Merchant / Payee Name *
                </label>
                <input
                  type="text"
                  required
                  value={reviewDraft.merchant || ''}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, merchant: e.target.value })}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-sm font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                    Amount ({currency.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={reviewDraft.amountCents ? (reviewDraft.amountCents / 100).toFixed(2) : ''}
                    onChange={(e) =>
                      setReviewDraft({
                        ...reviewDraft,
                        amountCents: parseToCents(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-base font-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                    VAT / Tax (15%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={reviewDraft.taxCents ? (reviewDraft.taxCents / 100).toFixed(2) : ''}
                    onChange={(e) =>
                      setReviewDraft({
                        ...reviewDraft,
                        taxCents: parseToCents(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-sm font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={reviewDraft.date || ''}
                    onChange={(e) => setReviewDraft({ ...reviewDraft, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                    Category
                  </label>
                  <select
                    value={reviewDraft.category || 'Tinkering & Gear'}
                    onChange={(e) => setReviewDraft({ ...reviewDraft, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-xs font-bold bg-white"
                  >
                    {db.budgetCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                  Description / Line Items
                </label>
                <input
                  type="text"
                  value={reviewDraft.description || ''}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, description: e.target.value })}
                  placeholder="Items purchased or invoice notes"
                  className="w-full p-2.5 rounded-xl border-2 border-slate-900 text-xs font-semibold bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewDraft(null)}
                className="w-1/3 py-3.5 bg-slate-200 hover:bg-slate-300 font-black text-sm rounded-2xl border-2 border-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="w-2/3 py-4 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-lg rounded-2xl chunky-btn flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                <span>PUT IN PIGGY BANK!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-200 border-3 border-slate-900 rounded-2xl font-black text-xs text-slate-900 shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="font-bold text-slate-700">✕</button>
        </div>
      )}

      {/* Stored Slips Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-black uppercase text-slate-900">Stored Receipts & Invoices</h3>
          <span className="text-xs font-bold text-slate-600">Preserved Originals</span>
        </div>

        {db.slips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center chunky-card">
            <span className="text-4xl">📸</span>
            <h4 className="text-base font-black text-slate-900 mt-2">No slips snapped yet!</h4>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Tap <strong>SNAP WITH CAMERA</strong> or <strong>UPLOAD</strong> to digitize receipts.
            </p>
          </div>
        ) : (
          db.slips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-3xl p-4 border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  onClick={() => slip.documentDataUrl && setPreviewModalDoc(slip.documentDataUrl)}
                  className="w-14 h-14 rounded-2xl border-2 border-slate-900 bg-amber-100 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden shadow-xs"
                  title="View original document"
                >
                  {slip.documentDataUrl ? (
                    slip.documentType === 'pdf' ? (
                      <FileText className="w-7 h-7 text-rose-600" />
                    ) : (
                      <img src={slip.documentDataUrl} alt="Slip" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="text-xl">🧾</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.2 bg-amber-100 text-[10px] font-black uppercase rounded-md border border-slate-900">
                      {slip.category}
                    </span>
                    {slip.isDuplicate && (
                      <span className="px-1.5 py-0.2 bg-rose-200 text-rose-950 text-[10px] font-black rounded-md border border-slate-900">
                        DUPLICATE
                      </span>
                    )}
                    {slip.syncedToLedger && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-950 text-[10px] font-black rounded-md border border-slate-900">
                        IN LEDGER
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-slate-950 truncate mt-0.5">{slip.merchant}</h4>
                  <p className="text-xs font-semibold text-slate-600 truncate">
                    {slip.date} • {slip.description || 'No description'}
                  </p>
                </div>
              </div>

              {/* Right side: Amount + action buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-black text-slate-950">{formatCents(slip.amountCents)}</div>
                  {slip.taxCents !== undefined && slip.taxCents > 0 && (
                    <div className="text-[10px] font-bold text-slate-500">
                      VAT: {formatCents(slip.taxCents)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {slip.documentDataUrl && (
                    <button
                      onClick={() => setPreviewModalDoc(slip.documentDataUrl || null)}
                      className="chunky-btn p-2 rounded-xl border-2 border-slate-900 bg-amber-100 hover:bg-amber-200"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {slip.documentDataUrl && (
                    <button
                      onClick={() => handleUploadDrive(slip)}
                      disabled={isUploadingDrive === slip.id}
                      className="chunky-btn p-2 rounded-xl border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs disabled:opacity-50"
                      title="Save to Google Drive"
                    >
                      <HardDrive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleShareSlipWhatsApp(slip)}
                    className="chunky-btn p-2 rounded-xl border-2 border-slate-900 bg-emerald-300 hover:bg-emerald-400 text-slate-950 text-xs font-black"
                    title="Share Slip to WhatsApp"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => deleteSlip(slip.id)}
                    className="chunky-btn p-2 rounded-xl border-2 border-slate-900 bg-rose-100 hover:bg-rose-200 text-rose-800"
                    title="Delete Slip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Full Preview Modal */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 chunky-card max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-3">
              <span className="text-sm font-black text-slate-900 uppercase">Original Document</span>
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 font-black text-sm flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-2xl border-2 border-slate-900">
              <img src={previewModalDoc} alt="Receipt preview" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
