import { RELEASE_NOTES } from "@/lib/release-notes";
import { APP_VERSION } from "@/lib/version";

export default function NotesPage() {
  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-teal-300/80 uppercase">
        Release notes
      </p>
      <h1 className="mt-1 text-2xl font-semibold">What shipped</h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        Website and Android share this list. Current build is {APP_VERSION}.
      </p>
      {RELEASE_NOTES.map((note) => (
        <article
          key={note.version}
          className="mb-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-4"
        >
          <div className="text-xs text-teal-200/80">
            {note.version} · {note.date}
          </div>
          <h2 className="mt-1 text-lg font-medium">{note.title}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/65">
            {note.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
