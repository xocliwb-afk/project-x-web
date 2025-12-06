"use client";
export default function LeadForm() {
  return (
    <div className="rounded-card bg-surface p-5 shadow-sm ring-1 ring-border">
      <h2 className="text-lg font-semibold text-text-main">Contact Agent</h2>
      <form className="mt-4 space-y-3">
        <input type="text" className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm" placeholder="Name" />
        <input type="email" className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm" placeholder="Email" />
        <input type="tel" className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm" placeholder="Phone" />
        <button className="w-full rounded-button bg-primary-accent px-4 py-2 font-semibold text-white">Request Info</button>
      </form>
    </div>
  );
}