import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter as DialogFtr,
} from "@/components/ui/dialog";
import {
    CreateComplaint,
    getAllCategories,
    getProjectById,
    getProjectByNumber,
} from "@/services/home/form";
import { useNavigate } from "react-router-dom";

type Equipment = { _id: string; name: string };
type ProjectInfo = {
    sitePersonName: string;
    siteLocation: string;
    siteAddress: string;
} | null;

export default function ComplaintFormPage() {
    // --- Mobile lookup ---
    const [mobile, setMobile] = useState("");
    const [checking, setChecking] = useState(false);
    const [lookupError, setLookupError] = useState("");

    // --- Project details ---
    const [projects, setProjects] = useState<any[]>([]);
    const [projectId, setProjectId] = useState("");
    const [projectInfo, setProjectInfo] = useState<ProjectInfo>(null);

    // --- Equipment ---
    const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
    const [equipmentId, setEquipmentId] = useState("");

    // --- Complaint details ---
    const [fault, setFault] = useState("");
    const [details, setDetails] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // --- Submit & result ---
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: "" | "success" | "error"; message: string }>({
        type: "",
        message: "",
    });
    const [successOpen, setSuccessOpen] = useState(false);
    const [ticketId, setTicketId] = useState("");
    const navigate = useNavigate();

    // --- Voice recorder state ---
    const [isRecording, setIsRecording] = useState(false);
    const [recorderReady, setRecorderReady] = useState<boolean | null>(null);
    const [recorderError, setRecorderError] = useState("");
    const [voiceClips, setVoiceClips] = useState<
        { blob: Blob; url: string; name: string; durationMs: number }[]
    >([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const tickRef = useRef<number | null>(null);
    const recordStartRef = useRef<number>(0);
    const [elapsedMs, setElapsedMs] = useState(0);

    // Track all created voice URLs (robust cleanup)
    const voiceUrlsRef = useRef<Set<string>>(new Set());

    // --- Helpers ---
    const sanitizeDigits = (s: string) => s.replace(/\D/g, "");
    const isValidMobile = useMemo(() => {
        const d = sanitizeDigits(mobile);
        return d.length >= 10 && d.length <= 14;
    }, [mobile]);

    const prettySize = (n: number) =>
        n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

    const fmt = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    };

    const pickBestMimeType = () => {
        const candidates = [
            "audio/webm;codecs=opus",
            "audio/ogg;codecs=opus",
            "audio/mp4",
            "audio/mpeg",
            "audio/webm",
            "audio/ogg",
        ];
        for (const c of candidates) {
            if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c;
        }
        return "";
    };

    const stopTicker = () => {
        if (tickRef.current) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
        }
    };

    // --- Effects ---
    // Detect recorder support
    useEffect(() => {
        try {
            const supported =
                typeof navigator !== "undefined" &&
                !!navigator.mediaDevices &&
                typeof navigator.mediaDevices.getUserMedia === "function" &&
                typeof (window as any).MediaRecorder === "function";

            setRecorderReady(supported);
        } catch {
            setRecorderReady(false);
        }
    }, []);

    // Cleanup previews on unmount
    useEffect(() => {
        return () => previews.forEach((u) => URL.revokeObjectURL(u));
    }, [previews]);

    // Robust unmount cleanup for voice
    useEffect(() => {
        return () => {
            voiceUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
            try {
                mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
            } catch { }
            stopTicker();
        };
    }, []);

    // --- Handlers ---
    const handleLookup = async () => {
        setResult({ type: "", message: "" });
        setLookupError("");

        const normalized = sanitizeDigits(mobile);
        if (!normalized || normalized.length < 10) {
            setLookupError("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            setChecking(true);
            const list = await getProjectByNumber({ number: normalized });
            const arr = Array.isArray(list?.data) ? list.data : list;

            if (!Array.isArray(arr) || arr.length === 0) {
                setProjects([]);
                setProjectId("");
                setProjectInfo(null);
                setLookupError("This mobile number is not registered with any project.");
                return;
            }

            setProjects(
                arr.map((p: any) => ({
                    _id: p._id,
                    name: p.name || p.code || "Unnamed Project",
                    code: p.code ?? "",
                }))
            );

            // Reset dependent fields
            setProjectId("");
            setProjectInfo(null);
            setEquipmentId("");
            setFault("");
            setDetails("");

            // Clear file previews
            previews.forEach((u) => URL.revokeObjectURL(u));
            setAttachments([]);
            setPreviews([]);
        } catch (err: any) {
            console.error("lookup error", err);
            setLookupError(err?.response?.data?.message || "Failed to lookup mobile.");
        } finally {
            setChecking(false);
        }
    };

    const handleSelectProject = async (value: string) => {
        setProjectId(value);
        setProjectInfo(null);
        setResult({ type: "", message: "" });

        try {
            const project = await getProjectById(value);
            const p = project?.data ?? project;
            if (!p) {
                setResult({ type: "error", message: "No project details found for this ID." });
                return;
            }
            setProjectInfo({
                sitePersonName: p.customer || "",
                siteLocation: p.state || "",
                siteAddress: typeof (p.site_address) === "object" ? p.site_address?.district_name || "N/A" : p.site_address || "N/A",
            });

            // Load equipment after project is selected (so list feels contextual)
            const data = await getAllCategories();
            setEquipmentOptions(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("fetch project info error", err);
            setResult({
                type: "error",
                message: err?.response?.data?.message || "Failed to fetch project details.",
            });
        }
    };

    const handleFilesSelected = (filesList: FileList | null) => {
        if (!filesList?.length) return;
        const incoming = Array.from(filesList);
        const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
        const existing = new Set(attachments.map(key));
        const filtered = incoming.filter((f) => !existing.has(key(f)));
        if (filtered.length === 0) return;
        const newPreviews = filtered.map((f) => URL.createObjectURL(f));
        setAttachments((prev) => [...prev, ...filtered]);
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeAttachmentAt = (idx: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[idx]);
            return prev.filter((_, i) => i !== idx);
        });
    };

    // --- Voice Recording ---
    const startRecording = async () => {
        setRecorderError("");
        if (isRecording) return;
        if (voiceClips.length >= 3) {
            setRecorderError("You can add up to 3 voice notes.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const mimeType = pickBestMimeType();
            const rec = new (window as any).MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = rec;
            chunksRef.current = [];
            recordStartRef.current = Date.now();
            setElapsedMs(0);

            rec.ondataavailable = (e: BlobEvent) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            rec.onstop = () => {
                stopTicker();
                const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
                const url = URL.createObjectURL(blob);
                voiceUrlsRef.current.add(url);

                const dur = Date.now() - recordStartRef.current;
                const idx = voiceClips.length + 1;
                const ext = (rec.mimeType || "audio/webm").split("/")[1].split(";")[0];
                const name = `voice-note-${idx}-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;

                setVoiceClips((prev) => [...prev, { blob, url, name, durationMs: dur }]);

                try {
                    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
                } catch { }
                mediaStreamRef.current = null;
                mediaRecorderRef.current = null;
                chunksRef.current = [];
                setElapsedMs(0);
            };

            // Soft cap: 2 minutes/clip
            tickRef.current = window.setInterval(() => {
                const ms = Date.now() - recordStartRef.current;
                setElapsedMs(ms);
                if (ms >= 120_000 && mediaRecorderRef.current?.state === "recording") {
                    try {
                        mediaRecorderRef.current.stop();
                    } catch { }
                    setIsRecording(false);
                }
            }, 200);

            rec.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Recorder start error:", err);
            setRecorderError(
                err?.name === "NotAllowedError"
                    ? "Microphone permission denied. Please allow mic access."
                    : "Could not start recording on this device."
            );
            setIsRecording(false);
            try {
                mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
            } catch { }
            mediaStreamRef.current = null;
            mediaRecorderRef.current = null;
            stopTicker();
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;
        try {
            mediaRecorderRef.current?.stop();
        } catch { }
        setIsRecording(false);
    };

    const removeVoiceAt = (i: number) => {
        setVoiceClips((prev) => {
            const item = prev[i];
            if (item?.url) {
                URL.revokeObjectURL(item.url);
                voiceUrlsRef.current.delete(item.url);
            }
            return prev.filter((_, idx) => idx !== i);
        });
    };

    // --- Submit ---
    const extractTicketId = (resp: any) => {
        return (
            resp?.ticket_id ||
            resp?.data?.ticket_id ||
            resp?.data?.data?.ticket_id ||
            resp?.data?.ticket?.ticket_id ||
            resp?.ticket?.ticket_id ||
            ""
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult({ type: "", message: "" });

        if (!isValidMobile)
            return setResult({ type: "error", message: "Enter a valid mobile number first." });
        if (!projectId) return setResult({ type: "error", message: "Please select a project." });
        if (!equipmentId)
            return setResult({ type: "error", message: "Please select affected equipment." });
        if (!fault.trim())
            return setResult({ type: "error", message: "Please enter a brief fault description." });

        try {
            setSubmitting(true);
            const form = new FormData();
            form.append("project_id", projectId);
            form.append("material", equipmentId);
            form.append("short_description", fault);
            form.append("description", details || "");

            // files
            attachments.forEach((file) => form.append("file", file, file.name));
            // voice clips
            voiceClips.forEach((clip) => form.append("file", clip.blob, clip.name));

            const resp = await CreateComplaint(form);

            const newTicketId = extractTicketId(resp) || extractTicketId(resp?.data);
            setTicketId(newTicketId);
            setSuccessOpen(true);

            setResult({
                type: "success",
                message: resp?.message || "Complaint submitted successfully.",
            });

            // reset (success path)
            previews.forEach((u) => URL.revokeObjectURL(u));
            setAttachments([]);
            setPreviews([]);

            voiceClips.forEach((c) => {
                URL.revokeObjectURL(c.url);
                voiceUrlsRef.current.delete(c.url);
            });
            setVoiceClips([]);

            setMobile("");
            setProjects([]);
            setProjectId("");
            setProjectInfo(null);
            setEquipmentId("");
            setFault("");
            setDetails("");
        } catch (err: any) {
            console.error("submit error", err);
            const serverMsg = err?.response?.data?.message || err?.message || "Submission failed.";
            setResult({ type: "error", message: serverMsg });
        } finally {
            setSubmitting(false);
        }
    };

    // --- Render ---
    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] to-white flex flex-col items-center">
                <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    {/* Heading + subheading (tuned for mobile) */}
                    <div className="text-center mb-6 sm:mb-8 px-2 mt-3 sm:mt-8">
                        <h1 className="text-lg sm:text-3xl lg:text-4xl font-semibold  text-[#1F487C] tracking-tight leading-snug sm:leading-tight">
                            Service Request Form
                        </h1>
                        <p className="mt-2 sm:mt-3 text-gray-600 text-xs sm:text-base">
                            Let us know your issue and our team will get back to you shortly.
                        </p>
                    </div>

                    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 rounded-2xl">
                        <CardContent className="p-3 sm:p-6 lg:p-8">

                            {result.message && (
                                <div
                                    className={`mb-6 rounded-md border px-4 py-3 text-sm ${result.type === "success"
                                        ? "border-green-300 bg-green-50 text-green-800"
                                        : result.type === "error"
                                            ? "border-red-300 bg-red-50 text-red-800"
                                            : "border-slate-200"
                                        }`}
                                    role="alert"
                                >
                                    {result.message}
                                </div>
                            )}

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                {/* STEP 1 */}
                                <section>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="grid gap-1.5 sm:gap-2">
                                            <Label htmlFor="mobile" className="text-xs sm:text-sm">
                                                Mobile No. <span className="text-red-500">*</span>
                                            </Label>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Input
                                                    id="mobile"
                                                    placeholder="Enter your registered mobile no."
                                                    value={mobile}
                                                    onChange={(e) => setMobile(e.target.value)}
                                                    inputMode="tel"
                                                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                                                    required
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleLookup}
                                                    disabled={checking || !mobile}
                                                    className="bg-[#1F487C] hover:bg-[#163864] w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
                                                >
                                                    {checking ? "Checking..." : "Check"}
                                                </Button>
                                            </div>

                                            {lookupError && <p className="text-xs sm:text-sm text-red-600">{lookupError}</p>}
                                        </div>
                                    </div>
                                </section>


                                {/* STEP 2 */}
                                {projects.length > 0 && (
                                    <section className="pt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="grid gap-1.5 sm:gap-2">
                                                <Label className="text-xs sm:text-sm">
                                                    Select Your Project <span className="text-red-500">*</span>
                                                </Label>

                                                <Select value={projectId} onValueChange={handleSelectProject}>
                                                    <SelectTrigger className="w-full h-10 sm:h-11 text-sm sm:text-base">
                                                        <SelectValue placeholder="Select Your Project" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-64 text-sm">
                                                        <SelectGroup>
                                                            <SelectLabel className="text-xs uppercase tracking-wide text-gray-500">Projects</SelectLabel>
                                                            {projects.map((p) => (
                                                                <SelectItem key={p._id} value={p._id} className="text-sm">
                                                                    {p.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </section>
                                )}


                                {/* STEP 3 */}
                                {projectId && projectInfo && (
                                    <>
                                        <section>
                                            <h3 className="text-sm sm:text-lg font-semibold text-[#1F487C] mt-1 mb-2 sm:mb-3">
                                                Project Information
                                            </h3>
                                            <div className="h-px bg-slate-200 mb-3 sm:hidden" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="grid gap-1.5 sm:gap-2">
                                                    <Label className="text-xs sm:text-sm">
                                                        Customer Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input value={projectInfo.sitePersonName || "-"} readOnly className="h-10 sm:h-11 text-sm" />
                                                </div>

                                                <div className="grid gap-1.5 sm:gap-2">
                                                    <Label className="text-xs sm:text-sm">
                                                        State <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input value={projectInfo.siteLocation || "-"} readOnly className="h-10 sm:h-11 text-sm" />
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-1.5 sm:gap-2">
                                                <Label className="text-xs sm:text-sm">
                                                    Site Address <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    value={projectInfo?.siteAddress || "-"}
                                                    readOnly
                                                    className="min-h-[68px] sm:min-h-[80px] resize-none whitespace-pre-wrap text-sm"
                                                />
                                            </div>

                                        </section>

                                        <section>
                                            <h3 className="text-sm sm:text-lg font-semibold text-[#1F487C] mt-1 mb-2 sm:mb-3">
                                                Issue Details
                                            </h3>
                                            <div className="h-px bg-slate-200 mb-3 sm:hidden" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="grid gap-1.5 sm:gap-2">
                                                    <Label className="text-xs sm:text-sm">
                                                        Select Your Affected Equipment <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select value={equipmentId} onValueChange={setEquipmentId}>
                                                        <SelectTrigger className="w-full h-10 sm:h-11 text-sm sm:text-base">
                                                            <SelectValue placeholder="Select affected equipment" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-64 text-sm">
                                                            <SelectGroup>
                                                                <SelectLabel className="text-xs uppercase tracking-wide text-gray-500">Equipment</SelectLabel>
                                                                {equipmentOptions.length > 0 ? (
                                                                    equipmentOptions.map((eq) => (
                                                                        <SelectItem key={eq._id} value={eq._id} className="text-sm">
                                                                            {eq.name}
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <SelectItem value="na" disabled className="text-sm">
                                                                        No options
                                                                    </SelectItem>
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid gap-1.5 sm:gap-2">
                                                    <Label htmlFor="fault" className="text-xs sm:text-sm">
                                                        Description of Fault <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="fault"
                                                        placeholder="Short description"
                                                        value={fault}
                                                        onChange={(e) => setFault(e.target.value)}
                                                        required
                                                        className="h-10 sm:h-11 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-1.5 sm:gap-2">
                                                <Label htmlFor="details" className="text-xs sm:text-sm">
                                                    Any Failure of equipment — Detailed Description
                                                </Label>
                                                <Textarea
                                                    id="details"
                                                    placeholder="Provide more details about the issue"
                                                    className="min-h-[96px] sm:min-h-[120px] text-sm"
                                                    value={details}
                                                    onChange={(e) => setDetails(e.target.value)}
                                                />
                                            </div>


                                            {/* Attachments */}
                                            <div className="mt-3 grid gap-1.5 sm:gap-2">
                                                <Label htmlFor="attachments" className="text-xs sm:text-sm">
                                                    Attachments (optional) — images, docs, or audio
                                                </Label>
                                                <Input
                                                    id="attachments"
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,audio/*"
                                                    onChange={(e) => handleFilesSelected(e.target.files)}
                                                    className="h-10 sm:h-11 text-sm"
                                                />
                                                {attachments.length > 0 && (
                                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                                        {attachments.map((file, idx) => {
                                                            const isImage = file.type?.startsWith("image/");
                                                            const url = previews[idx]; // created in handleFilesSelected
                                                            return (
                                                                <div
                                                                    key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                                                                    className={`relative ${isImage ? "h-24" : ""} rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeAttachmentAt(idx)}
                                                                        className="absolute -right-2 -top-2 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                                                                    >
                                                                        ×
                                                                    </button>

                                                                    {isImage ? (
                                                                        <img
                                                                            src={url}
                                                                            alt={file.name}
                                                                            className="h-full w-full object-cover"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex items-center gap-3 px-3 py-2">
                                                                            <div className="h-8 w-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 text-sm">
                                                                                📄
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="truncate text-sm font-medium text-gray-800 max-w-[160px]">
                                                                                    {file.name}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {prettySize(file.size)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                            </div>


                                            {/* Voice Note */}
                                            <div className="mt-5 grid gap-1.5 sm:gap-2">
                                                <Label className="text-xs sm:text-sm">Voice Note (optional)</Label>

                                                {recorderReady === false && (
                                                    <div className="text-xs sm:text-sm text-slate-600">
                                                        This browser doesn’t support in-app recording. You can still attach an audio file above.
                                                    </div>
                                                )}

                                                {recorderReady !== false && (
                                                    <div className="rounded-lg border border-slate-200 p-2 sm:p-3 bg-white">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                                            <div className="text-xs sm:text-sm text-slate-700">
                                                                {isRecording ? (
                                                                    <span className="inline-flex items-center gap-2">
                                                                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                                        Recording… <span className="font-medium ml-1">{fmt(elapsedMs)}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span>Click “Start” to record (max ~2 min per clip, up to 3 clips)</span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {!isRecording ? (
                                                                    <Button type="button" className="bg-[#1F487C] hover:bg-[#163864] h-9 sm:h-10 text-sm" onClick={startRecording}>
                                                                        Start
                                                                    </Button>
                                                                ) : (
                                                                    <Button type="button" variant="destructive" className="h-9 sm:h-10 text-sm" onClick={stopRecording}>
                                                                        Stop
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {recorderError && <p className="mt-2 text-xs sm:text-sm text-red-600">{recorderError}</p>}

                                                        {voiceClips.length > 0 && (
                                                            <div className="mt-2 grid gap-2">
                                                                {voiceClips.map((c, i) => (
                                                                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-md border border-slate-200 p-3 bg-white">
                                                                        <div className="min-w-0">
                                                                            <div className="text-xs sm:text-sm font-medium text-slate-800 truncate max-w-[200px] sm:max-w-[360px]">
                                                                                {c.name}
                                                                            </div>
                                                                            <div className="text-[10px] sm:text-xs text-slate-500">{fmt(c.durationMs)}</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <audio
                                                                                src={c.url}
                                                                                controls
                                                                                className="w-full max-w-[220px] sm:max-w-[260px] rounded-md border border-slate-200 bg-slate-50"
                                                                                style={{ display: "block" }}
                                                                            />

                                                                            <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => removeVoiceAt(i)}>
                                                                                Remove
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                        </section>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="px-4 sm:px-6 py-2 h-10 text-sm border-[#1F487C] text-[#1F487C] hover:bg-[#eef5ff] w-full sm:w-auto"
                                        onClick={() => {
                                            setMobile("");
                                            setProjects([]);
                                            setProjectId("");
                                            setProjectInfo(null);
                                            setEquipmentId("");
                                            setFault("");
                                            setDetails("");
                                            previews.forEach((u) => URL.revokeObjectURL(u));
                                            setAttachments([]);
                                            setPreviews([]);
                                            // clear voice clips + revoke URLs
                                            voiceClips.forEach((c) => {
                                                URL.revokeObjectURL(c.url);
                                                voiceUrlsRef.current.delete(c.url);
                                            });
                                            setVoiceClips([]);
                                            setLookupError("");
                                            setResult({ type: "", message: "" });
                                        }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting || !projectId || !projectInfo}
                                        className="bg-[#1F487C] hover:bg-[#163864] px-6 sm:px-8 py-2 h-10 text-sm text-white w-full sm:w-auto"
                                    >
                                        {submitting ? "Submitting..." : "Submit"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter />
                    </Card>
                </div>
            </div>

            {/* ===== Success Modal ===== */}
            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-green-700">
                            Complaint registered successfully
                        </DialogTitle>
                        <DialogDescription>
                            Thanks for reaching out—your complaint has been logged. We’ll get back to you soon. Track its status anytime with your phone number or Ticket ID.                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 rounded-lg border bg-white p-3">
                        <p className="text-sm text-slate-600">Your Ticket No.</p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="font-semibold text-[#1F487C] break-all">
                                {ticketId || "—"}
                            </span>
                            <Button
                                className="cursor-pointer"
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(ticketId || "");
                                    } catch { }
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                    </div>

                    <DialogFtr className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setSuccessOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>

                        <Button
                            className="w-full sm:w-auto bg-[#1F487C] hover:bg-[#163864]"
                            onClick={() => {
                                navigate("/ticket-status");
                            }}
                        >
                            Track Status
                        </Button>
                    </DialogFtr>
                </DialogContent>
            </Dialog>
        </>

    );
}
