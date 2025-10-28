import React, { useEffect, useMemo, useState } from "react";
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

export default function ComplaintFormPage() {
  const [mobile, setMobile] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectInfo, setProjectInfo] = useState(null);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [fault, setFault] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState({ type: "", message: "" });
  const [successOpen, setSuccessOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const navigate = useNavigate();

  // Load equipment list
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllCategories();
        setEquipmentOptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching equipment categories:", error);
      }
    })();
  }, []);

  const sanitizeDigits = (s) => s.replace(/\D/g, "");
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
      const list = await getProjectByNumber({ number: normalized });
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
        arr.map((p) => ({
          _id: p._id,
          name: p.name || p.code || "Unnamed Project",
          code: p.code ?? "",
        }))
      );
      setProjectId("");
      setProjectInfo(null);
      setEquipmentId("");
      setFault("");
      setDetails("");
      previews.forEach((u) => URL.revokeObjectURL(u));
      setAttachments([]);
      setPreviews([]);
    } catch (err) {
      console.error("lookup error", err);
      setLookupError(
        err?.response?.data?.message || "Failed to lookup mobile."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSelectProject = async (value) => {
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
    } catch (err) {
      console.error("fetch project info error", err);
      setResult({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to fetch project details.",
      });
    }
  };

  const prettySize = (n) =>
    n < 1024
      ? `${n} B`
      : n < 1024 * 1024
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / (1024 * 1024)).toFixed(1)} MB`;

  const handleFilesSelected = (filesList) => {
    if (!filesList?.length) return;
    const incoming = Array.from(filesList);
    const key = (f) => `${f.name}-${f.size}-${f.lastModified}`;
    const existing = new Set(attachments.map(key));
    const filtered = incoming.filter((f) => !existing.has(key(f)));
    if (filtered.length === 0) return;
    const newPreviews = filtered.map((f) => URL.createObjectURL(f));
    setAttachments((prev) => [...prev, ...filtered]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachmentAt = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const extractTicketId = (resp) => {
    return (
      resp?.ticket_id ||
      resp?.data?.ticket_id ||
      resp?.data?.data?.ticket_id ||
      resp?.data?.ticket?.ticket_id ||
      resp?.ticket?.ticket_id ||
      ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult({ type: "", message: "" });

    if (!isValidMobile)
      return setResult({
        type: "error",
        message: "Enter a valid mobile number first.",
      });
    if (!projectId)
      return setResult({ type: "error", message: "Please select a project." });
    if (!equipmentId)
      return setResult({
        type: "error",
        message: "Please select affected equipment.",
      });
    if (!fault.trim())
      return setResult({
        type: "error",
        message: "Please enter a brief fault description.",
      });

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("project_id", projectId);
      form.append("material", equipmentId);
      form.append("short_description", fault);
      form.append("description", details || "");
      attachments.forEach((file) => form.append("file", file, file.name));

      const resp = await CreateComplaint(form);

      const newTicketId = extractTicketId(resp) || extractTicketId(resp?.data);
      setTicketId(newTicketId);
      setSuccessOpen(true);

      setResult({
        type: "success",
        message: resp?.message || "Complaint submitted successfully.",
      });

      // reset form
      previews.forEach((u) => URL.revokeObjectURL(u));
      setAttachments([]);
      setPreviews([]);
      setMobile("");
      setProjects([]);
      setProjectId("");
      setProjectInfo(null);
      setEquipmentId("");
      setFault("");
      setDetails("");
    } catch (err) {
      console.error("submit error", err);
      const serverMsg =
        err?.response?.data?.message || err?.message || "Submission failed.";
      setResult({ type: "error", message: serverMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] to-white flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8 px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F487C]">
              Complaint Form
            </h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">
              Let us know your issue and our team will get back to you shortly.
            </p>
          </div>

          <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 rounded-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {result.message && (
                <div
                  className={`mb-6 rounded-md border px-4 py-3 text-sm ${
                    result.type === "success"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="mobile">
                        Mobile No. <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
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
                          className="bg-[#1F487C] hover:bg-[#163864] w-full sm:w-auto"
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

                {/* STEP 2 */}
                {projects.length > 0 && (
                  <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label>
                          Select Your Project{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={projectId}
                          onValueChange={handleSelectProject}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Your Project" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
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

                {/* STEP 3 */}
                {projectId && projectInfo && (
                  <>
                    <section>
                      <h3 className="text-base sm:text-lg font-semibold text-[#1F487C] mb-2">
                        Project Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                          <Label>
                            Customer Name{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={projectInfo.sitePersonName || "-"}
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>
                            State <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={projectInfo.siteLocation || "-"}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <Label>
                          Site Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={projectInfo?.siteAddress || "-"}
                          readOnly
                          className="min-h-[80px] resize-none whitespace-pre-wrap text-sm sm:text-base"
                        />
                      </div>
                    </section>

                    <section>
                      <h3 className="text-base sm:text-lg font-semibold text-[#1F487C] mb-2">
                        Issue Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                          <Label>
                            Select Your Affected Equipment{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={equipmentId}
                            onValueChange={setEquipmentId}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select affected equipment" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
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
                          <Label htmlFor="fault">
                            Description of Fault{" "}
                            <span className="text-red-500">*</span>
                          </Label>
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

                      <div className="mt-4 grid gap-2">
                        <Label htmlFor="attachments">
                          Attachments (optional)
                        </Label>
                        <Input
                          id="attachments"
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                          onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                        {attachments.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {attachments.map((file, idx) => {
                              const isImage = file.type.startsWith("image/");
                              const url = previews[idx];
                              return (
                                <div
                                  key={idx}
                                  className={`relative ${
                                    isImage ? "h-24" : ""
                                  } rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden`}
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
                    </section>
                  </>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 py-2 border-[#1F487C] text-[#1F487C] hover:bg-[#eef5ff] w-full sm:w-auto"
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
                    className="bg-[#1F487C] hover:bg-[#163864] px-8 py-2 text-white w-full sm:w-auto"
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
              Your request has been recorded. Our team will get back to you
              soon.
            </DialogDescription>
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
                  } catch {}
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
