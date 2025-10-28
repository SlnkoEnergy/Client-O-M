import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
    CreateComplaint,
    getAllCategories,
    getProjectById,
    getProjectByNumber,
} from "@/services/home/form";

export default function ComplaintFormPage() {
    // --- step state
    const [mobile, setMobile] = useState("");
    const [checking, setChecking] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [openModal, setOpenModal] = useState(false)

    const [projects, setProjects] = useState<
        Array<{ _id: string; code: string; name: string }>
    >([]);

    const [projectId, setProjectId] = useState<string>("");
    const [projectInfo, setProjectInfo] = useState<{
        sitePersonName?: string;
        siteLocation?: string;
        siteAddress?: string;
    } | null>(null);

    const [equipmentOptions, setEquipmentOptions] = useState<
        Array<{ _id: string; name: string }>
    >([]);

    // complaint fields
    const [equipmentId, setEquipmentId] = useState<string>("");
    const [fault, setFault] = useState("");
    const [details, setDetails] = useState("");

    // 🔹 MULTI-FILE: attachments + previews
    const [attachments, setAttachments] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{
        type: "" | "success" | "error";
        message: string;
    }>({
        type: "",
        message: "",
    });

    // --- load equipment categories once
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getAllCategories();
                setEquipmentOptions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching equipment categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // --- helpers
    const sanitizeDigits = (s: string) => s.replace(/\D/g, "");
    const isValidMobile = useMemo(() => {
        const d = sanitizeDigits(mobile);
        return d.length >= 10 && d.length <= 14;
    }, [mobile]);

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

            // service expected payload: { number }
            const list = await getProjectByNumber({ number: normalized });

            // assuming service returns { message, data: [...] } or the array
            const arr = Array.isArray(list?.data) ? list.data : list;

            if (!Array.isArray(arr) || arr.length === 0) {
                setProjects([]);
                setProjectId("");
                setProjectInfo(null);
                setLookupError(
                    "This mobile number is not registered with any project."
                );
                return;
            }

            setProjects(
                arr.map((p: any) => ({
                    _id: p._id,
                    name: p.name || p.code || "Unnamed Project",
                    code: p.code ?? "",
                }))
            );

            // reset downstream fields
            setProjectId("");
            setProjectInfo(null);
            setEquipmentId("");
            setFault("");
            setDetails("");

            // cleanup attachments & previews
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
                setResult({
                    type: "error",
                    message: "No project details found for this ID.",
                });
                return;
            }

            setProjectInfo({
                sitePersonName: p.customer || "",
                siteLocation: p.state || "",
                siteAddress: p.site_address || p.siteAddress || "",
            });
        } catch (err: any) {
            console.error("fetch project info error", err);
            setResult({
                type: "error",
                message:
                    err?.response?.data?.message || "Failed to fetch project details.",
            });
        }
    };

    // ---------- MULTI-FILE handlers ----------
    const prettySize = (n: number) => {
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFilesSelected = (filesList: FileList | null) => {
        if (!filesList?.length) return;

        const incoming = Array.from(filesList);

        // optional dedupe by name+size+modified
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
            URL.revokeObjectURL(prev[idx]); // memory cleanup
            return prev.filter((_, i) => i !== idx);
        });
    };

    // cleanup previews on unmount
    useEffect(() => {
        return () => {
            previews.forEach((u) => URL.revokeObjectURL(u));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult({ type: "", message: "" });

        if (!isValidMobile) {
            setResult({ type: "error", message: "Enter a valid mobile number first." });
            return;
        }
        if (!projectId) {
            setResult({ type: "error", message: "Please select a project." });
            return;
        }
        if (!equipmentId) {
            setResult({ type: "error", message: "Please select affected equipment." });
            return;
        }
        if (!fault.trim()) {
            setResult({
                type: "error",
                message: "Please enter a brief fault description.",
            });
            return;
        }

        try {
            setSubmitting(true);

            const form = new FormData();
            form.append("project_id", projectId);
            form.append("material", equipmentId);
            form.append("short_description", fault);
            form.append("description", details || "");

            attachments.forEach((file) => {
                form.append("file", file, file.name); 
            });

            // send it
            const resp = await CreateComplaint(form);

            console.log("submitted:", resp);
            setResult({
                type: "success",
                message: resp?.message || "Complaint submitted successfully.",
            });

            previews.forEach((u) => URL.revokeObjectURL(u));
            setAttachments([]);
            setPreviews([]);
            setMobile("");

        } catch (err: any) {
            console.error("submit error", err);
            const serverMsg =
                err?.response?.data?.message || err?.message || "Submission failed.";
            setResult({ type: "error", message: serverMsg });
        } finally {
            setSubmitting(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] to-white flex flex-col items-center py-12 px-4">
            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-[#1F487C]">Complaint Form</h1>
                <p className="mt-2 text-gray-600">
                    Let us know your issue and our team will get back to you shortly.
                </p>
            </div>

            <Card className="w-full max-w-3xl shadow-lg border-0 rounded-2xl">
                <CardContent>
                    {/* Alert */}
                    {result.message ? (
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
                    ) : null}

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* STEP 1: Mobile only */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile">Mobile No.</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="mobile"
                                            placeholder="Enter your registered mobile no."
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            inputMode="tel"
                                            className="flex-1"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleLookup}
                                            disabled={checking || !mobile}
                                            className="bg-[#1F487C] hover:bg-[#163864]"
                                        >
                                            {checking ? "Checking..." : "Check"}
                                        </Button>
                                    </div>
                                    {lookupError && (
                                        <p className="text-sm text-red-600">{lookupError}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* STEP 2: Show project select ONLY IF we have projects */}
                        {projects.length > 0 && (
                            <section>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label>Select Your Project</Label>
                                        <Select value={projectId} onValueChange={handleSelectProject}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Your Project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Projects</SelectLabel>
                                                    {projects.map((p) => (
                                                        <SelectItem key={p._id} value={p._id}>
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

                        {/* STEP 3: Readonly project info + remaining fields */}
                        {projectId && projectInfo && (
                            <>
                                {/* Readonly section */}
                                <section>
                                    <h3 className="text-lg font-semibold text-[#1F487C] mb-2">
                                        Project Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label>Customer Name</Label>
                                            <Input value={projectInfo.sitePersonName || "-"} disabled />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>State</Label>
                                            <Input value={projectInfo.siteLocation || "-"} disabled />
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-2">
                                        <Label>Site Address</Label>
                                        <Input value={projectInfo.siteAddress || "-"} disabled />
                                    </div>
                                </section>

                                {/* Complaint inputs */}
                                <section>
                                    <h3 className="text-lg font-semibold text-[#1F487C] mb-2">
                                        Issue Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label>Select Your Affected Equipment</Label>
                                            <Select value={equipmentId} onValueChange={setEquipmentId}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select affected equipment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Equipment</SelectLabel>
                                                        {equipmentOptions.length > 0 ? (
                                                            equipmentOptions.map((eq) => (
                                                                <SelectItem key={eq._id} value={eq._id}>
                                                                    {eq.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="na" disabled>
                                                                No options
                                                            </SelectItem>
                                                        )}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="fault">Description of Fault</Label>
                                            <Input
                                                id="fault"
                                                placeholder="Short description"
                                                value={fault}
                                                onChange={(e) => setFault(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-2">
                                        <Label htmlFor="details">
                                            Any Failure of equipment — Detailed Description
                                        </Label>
                                        <Textarea
                                            id="details"
                                            placeholder="Provide more details about the issue"
                                            className="min-h-[120px]"
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                        />
                                    </div>

                                    {/* 🔹 Multiple attachments with Camera + Files option */}
                                    <div className="mt-4 grid gap-2">
                                        <Label htmlFor="attachments">Attachments (optional)</Label>
                                        <Input
                                            id="attachments"
                                            type="file"
                                            multiple
                                            // Show Camera + Files on mobile; on desktop it behaves like normal picker
                                            capture="environment"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                            onChange={(e) => handleFilesSelected(e.target.files)}
                                        />

                                        {/* Thumbnails / file chips */}
                                        {attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {attachments.map((file, idx) => {
                                                    const isImage = file.type.startsWith("image/");
                                                    const url = previews[idx];

                                                    return (
                                                        <div
                                                            key={`${file.name}-${file.size}-${file.lastModified}`}
                                                            className={`relative ${isImage ? "w-20 h-20" : "w-auto"
                                                                } rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden`}
                                                        >
                                                            {/* Remove (×) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachmentAt(idx)}
                                                                aria-label={`Remove ${file.name}`}
                                                                className="absolute -right-2 -top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow hover:bg-red-600"
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>

                                                            {/* Image preview OR file chip */}
                                                            {isImage ? (
                                                                <img
                                                                    src={url}
                                                                    alt={file.name}
                                                                    className="h-full w-full object-cover"
                                                                    draggable={false}
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-3 px-3 py-2 max-w-[220px]">
                                                                    <div className="h-8 w-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 text-sm">
                                                                        📄
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="truncate text-sm font-medium text-gray-800">
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
                                </section>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="px-6 py-2 border-[#1F487C] text-[#1F487C] hover:bg-[#eef5ff]"
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
                                    setLookupError("");
                                    setResult({ type: "", message: "" });
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !projectId || !projectInfo}
                                className="bg-[#1F487C] hover:bg-[#163864] px-8 py-2 text-white"
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter />
            </Card>
        </div>
    );
}
