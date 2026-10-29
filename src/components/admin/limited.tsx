import { Panel } from "./ui";

/** Shown when a page loads but the signed-in role lacks the capability behind it. */
export function Limited({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <Panel className="px-5 py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E7C93]">Restricted</p>
        <h1 className="mt-2 text-[17px] font-semibold text-[#F8FAFC]">{title}</h1>
        <p className="mt-2 text-[12.5px] leading-6 text-[#94A3B8]">{body}</p>
        <p className="mt-3 text-[11px] leading-5 text-[#6E7C93]">
          Capabilities are enforced on the server for every action, not just hidden in this navigation.
        </p>
      </Panel>
    </div>
  );
}
