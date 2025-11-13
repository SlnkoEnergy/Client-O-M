"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTicketDetail } from "@/services/home/TrackStatus";

/* ---------- helpers ---------- */
const fmtDateTime = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "N/A";

const badgeClass = (status?: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-slate-600";
  if (s === "in progress") return "bg-amber-600";
  if (s === "completed") return "bg-emerald-600";
  if (s === "cancelled") return "bg-rose-600";
  return "bg-slate-500";
};

const formatStatus = (s = "") =>
  s
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Initials for avatar: "Rahul Odd" -> "RO" */
const getInitials = (name?: string) => {
  const n = (name || "").trim();
  if (!n) return "NA";
  const parts = n.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Simple check if URL is an image */
const isImageUrl = (url?: string) => {
  if (!url) return false;
  const clean = url.split("?")[0];
  return /\.(png|jpe?g|webp|gif)$/i.test(clean);
};

type HistoryItem = {
  status?: string;
  remarks?: string;
  updatedAt?: string;
};

/* ---------- types for task comments & attachments ---------- */
type TaskUser = {
  _id: string;
  name?: string;
  email?: string;
};

type TaskComment = {
  _id: string;
  remarks?: string;
  updatedAt?: string;
  user_id?: TaskUser;
};

type TaskAttachment = {
  _id: string;
  name?: string;
  url?: string;
  updatedAt?: string;
  user_id?: TaskUser;
};

type TicketItem = {
  _id: string;
  ticket_id?: string;
  project_id?: { _id: string; name?: string; customer?: string };
  material?: { _id: string; name?: string };
  number?: number | string;
  short_description?: string;
  description?: string;
  status_history?: HistoryItem[];
  current_status?: { status?: string; remarks?: string; updatedAt?: string };
  createdAt?: string;
  updatedAt?: string;
  deadline?: string;
  // coming from backend (task data)
  task_comments?: TaskComment[];
  task_attachments?: TaskAttachment[];
};

type CombinedAttachment = {
  _id: string;
  url?: string;
  name?: string;
  updatedAt?: string;
  user?: TaskUser;
  source: "task" | "ticket";
};

export default function TrackStatusField() {
  const [ticketNo, setTicketNo] = useState("");
  const [ticketData, setTicketData] = useState<TicketItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);

  // Derived: currently selected ticket (when there are multiple results)
  const ticket = useMemo(
    () =>
      selectedIdx != null && ticketData[selectedIdx]
        ? ticketData[selectedIdx]
        : ticketData[0],
    [selectedIdx, ticketData]
  );

  // If exactly one result arrives, open details automatically
  useEffect(() => {
    if (ticketData.length === 1) setSelectedIdx(0);
    if (ticketData.length > 1) setSelectedIdx(null);
  }, [ticketData]);

  // When ticket changes, collapse attachments again
  useEffect(() => {
    setShowAttachments(false);
  }, [ticket?._id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSelectedIdx(null);
    setShowAttachments(false);

    try {
      const raw = String(ticketNo || "").trim();
      if (!raw) {
        setError("Please enter your Ticket Number or Phone Number.");
        return;
      }

      const res = await getTicketDetail(raw);
      const list: TicketItem[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setTicketData(list);
      if (list.length === 0) setError("No matching tickets found.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to fetch ticket details."
      );
      setTicketData([]);
    } finally {
      setLoading(false);
    }
  };

  const history: HistoryItem[] = useMemo(() => {
    const items = Array.isArray(ticket?.status_history)
      ? [...ticket!.status_history]
      : [];
    // Sort by updatedAt ascending; tolerate missing timestamps
    items.sort((a, b) => {
      const da = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return da - db;
    });
    return items;
  }, [ticket]);

  // Resolve a "current status" string
  const currentStatus =
    ticket?.current_status?.status ??
    (history.length ? history[history.length - 1]?.status : undefined) ??
    "N/A";

  // Combined attachments (task_attachments only, for now)
  const combinedAttachments: CombinedAttachment[] = useMemo(() => {
    const fromTask: CombinedAttachment[] =
      ticket?.task_attachments?.map((a) => ({
        _id: a._id,
        url: a.url,
        name: a.name || a.url,
        updatedAt: a.updatedAt,
        user: a.user_id,
        source: "task",
      })) || [];

    return [...fromTask];
  }, [ticket]);

  /* ---------- compact card renderer for search results ---------- */
  const ResultsGrid = () => (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ticketData.map((t, idx) => (
        <Card
          key={t._id || idx}
          className="border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          onClick={() => setSelectedIdx(idx)}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  Ticket ID
                </div>
                <div className="font-semibold text-slate-900 text-sm break-words">
                  {t.ticket_id || "N/A"}
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm ${badgeClass(
                  t.current_status?.status
                )}`}
                title={formatStatus(t.current_status?.status) || "N/A"}
              >
                {formatStatus(t.current_status?.status) || "N/A"}
              </span>
            </div>

            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {t.project_id?.customer || "-"}
              </span>
            </div>

            <div className="mt-1 text-xs space-y-1.5">
              <div className="flex gap-2 items-start">
                <span className="text-slate-500 min-w-16">Project</span>
                <span className="font-medium flex-1 break-words whitespace-normal text-slate-900">
                  {t.project_id?.name || "N/A"}
                </span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-slate-500 min-w-16">Material</span>
                <span className="flex-1 break-words whitespace-normal text-slate-800">
                  {t.material?.name || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4">
            <Button
              className="w-full h-9 text-xs font-medium"
              variant="secondary"
              onClick={() => setSelectedIdx(idx)}
            >
              View details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] to-white flex">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 rounded-2xl">
          <CardHeader className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-slate-100/80">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 flex items-center justify-between gap-3">
              <span>Track Your Service Ticket</span>
              <span className="hidden sm:inline-flex text-[11px] uppercase tracking-wide px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                Live Status
              </span>
            </CardTitle>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 ">
              Enter your ticket number or registered mobile number to view
              current status and activity.
            </p>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 lg:px-8 pb-4 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="ticket"
                    className="text-sm sm:text-base font-medium text-slate-800"
                  >
                    Ticket No. / Phone
                  </Label>
                  <Input
                    id="ticket"
                    type="text"
                    placeholder="e.g., TRJ021 or 8107XXXXXX"
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    required
                    className="h-10 sm:h-11 rounded-xl border-slate-200 focus-visible:ring-sky-500 text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto h-11 rounded-xl px-6 text-sm font-semibold"
                  >
                    {loading ? "Searching..." : "Search Ticket"}
                  </Button>

                  {ticketData.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto h-11 rounded-xl px-6 text-sm"
                      onClick={() => {
                        setTicketData([]);
                        setSelectedIdx(null);
                        setError("");
                        setTicketNo("");
                        setShowAttachments(false);
                      }}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs sm:text-sm font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4 px-4 sm:px-6 lg:px-8 pb-6 pt-2">
            {/* --- Multiple results -> show compact cards --- */}
            {ticketData.length > 1 && selectedIdx == null && <ResultsGrid />}

            {/* --- Single selection/details view --- */}
            {ticketData.length > 0 &&
              (ticketData.length === 1 || selectedIdx != null) &&
              ticket && (
                <>
                  {ticketData.length > 1 && (
                    <div className="w-full flex justify-between items-center mb-2">
                      <Button
                        variant="ghost"
                        className="px-0 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setSelectedIdx(null)}
                      >
                        ← Back to all tickets
                      </Button>
                    </div>
                  )}

                  <div
                    className="
                      mt-1 w-full bg-gray-50 border rounded-2xl p-4 sm:p-5 lg:p-6 text-left
                      max-h-[70vh] overflow-y-auto
                      sm:max-h-none sm:overflow-visible
                    "
                  >
                    {/* Ticket header pill */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">
                          Ticket Details
                        </span>
                        <div className="inline-flex items-center gap-2">
                          <span className="text-base sm:text-lg font-semibold text-slate-900">
                            {ticket?.ticket_id || "N/A"}
                          </span>
                          {ticket?.project_id?.customer && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] text-slate-700 border border-slate-200">
                              {ticket.project_id.customer}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${badgeClass(
                          currentStatus
                        )}`}
                      >
                        {formatStatus(currentStatus)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm bg-white border border-slate-100 rounded-2xl p-4">
                      <p>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Project
                        </span>
                        <span className="font-medium text-slate-900">
                          {ticket?.project_id?.name || "N/A"}
                        </span>
                      </p>

                      <p>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Material
                        </span>
                        <span className="font-medium text-slate-900">
                          {ticket?.material?.name || "N/A"}
                        </span>
                      </p>

                      <p>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Description
                        </span>
                        <span className="text-slate-800">
                          {ticket?.short_description || "N/A"}
                        </span>
                      </p>

                      <p>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Expected Closing Date
                        </span>
                        <span className="text-slate-800">
                          {ticket?.deadline
                            ? fmtDateTime(ticket.deadline)
                            : "N/A"}
                        </span>
                      </p>

                      <p className="sm:col-span-2">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Remarks
                        </span>
                        <span className="text-slate-800">
                          {ticket?.current_status?.remarks || "N/A"}
                        </span>
                      </p>

                      <p className="sm:col-span-2">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                          Last Updated
                        </span>
                        <span className="text-slate-800">
                          {fmtDateTime(ticket?.current_status?.updatedAt)}
                        </span>
                      </p>
                    </div>

                    {/* --- Status Timeline (vertical) --- */}
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-1 rounded-full bg-sky-500/80" />
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                          Status Timeline
                        </h3>
                      </div>

                      {history.length === 0 ? (
                        <p className="text-sm text-slate-600 bg-white border border-dashed border-slate-200 rounded-2xl px-4 py-3">
                          No status history available yet.
                        </p>
                      ) : (
                        <ol className="relative border-l border-slate-200 pl-5 sm:pl-6">
                          {history.map((item, idx) => (
                            <li key={idx} className="mb-5 sm:mb-6 ml-1">
                              {/* dot */}
                              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                              {/* row */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 bg-white rounded-xl px-3 py-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${badgeClass(
                                      item.status
                                    )}`}
                                  >
                                    {formatStatus(item.status) || "N/A"}
                                  </span>
                                  {item.remarks && (
                                    <span className="text-[13px] sm:text-sm text-slate-800 font-medium leading-snug">
                                      {item.remarks}
                                    </span>
                                  )}
                                </div>
                                <time className="text-[11px] sm:text-xs text-slate-500">
                                  {fmtDateTime(item.updatedAt)}
                                </time>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    {/* ---------- Activity Stream ---------- */}
                    <div className="mt-8">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-1 rounded-full bg-amber-500/80" />
                          <h3 className="font-semibold text-sm sm:text-base text-gray-800">
                            Activity Stream
                          </h3>
                        </div>

                        {combinedAttachments.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs w-full sm:w-auto rounded-full border-slate-200"
                            onClick={() =>
                              setShowAttachments((prev) => !prev)
                            }
                          >
                            {showAttachments
                              ? `Hide Attachments (${combinedAttachments.length})`
                              : `Show Attachments (${combinedAttachments.length})`}
                          </Button>
                        )}
                      </div>

                      {/* Attachments cards (collapsible, vertical on mobile) */}
                      {showAttachments && combinedAttachments.length > 0 && (
                        <div className="mb-4 grid gap-4 sm:grid-cols-2">
                          {combinedAttachments.map((att) => (
                            <div
                              key={att._id}
                              className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                              {isImageUrl(att.url) ? (
                                <div className="h-32 bg-slate-100 overflow-hidden">
                                  <img
                                    src={att.url}
                                    alt={att.name || "Attachment"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                                  File Preview
                                </div>
                              )}

                              <div className="p-3">
                                <div className="text-xs font-medium text-slate-900 truncate">
                                  {att.name || "Attachment"}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-500 truncate">
                                    {att.user?.name ||
                                      ticket?.project_id?.customer ||
                                      "—"}
                                  </span>
                                  <a
                                    href={att.url}
                                    download
                                    className="text-[11px] font-medium text-sky-700 hover:text-sky-900"
                                  >
                                    Download
                                  </a>
                                </div>
                                <div className="mt-1 text-[10px] text-slate-400">
                                  {fmtDateTime(att.updatedAt)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comments feed */}
                      <div className="space-y-3">
                        {ticket.task_comments &&
                          ticket.task_comments.length > 0 ? (
                          ticket.task_comments.map((c) => (
                            <div
                              key={c._id}
                              className="flex items-start gap-3 border-b border-slate-200 pb-3 last:border-b-0"
                            >
                              {/* Avatar */}
                              <div className="h-9 w-9 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-[11px] font-semibold text-sky-700 flex-none">
                                {getInitials(c.user_id?.name)}
                              </div>

                              {/* Text */}
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                                  <span className="font-semibold text-slate-900">
                                    {c.user_id?.name ||
                                      ticket?.project_id?.customer ||
                                      "Unknown user"}
                                  </span>
                                  {c.user_id?.email && (
                                    <span className="text-slate-500">
                                      {c.user_id.email}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400">
                                    {fmtDateTime(c.updatedAt)}
                                  </span>
                                </div>
                                <p className="mt-1 text-[13px] sm:text-sm text-slate-800 whitespace-pre-line">
                                  {c.remarks || "—"}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-500 bg-white border border-dashed border-slate-200 rounded-2xl px-4 py-3">
                            No activity yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
