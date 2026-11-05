import "./style.css";
import { load, save } from "./storage";
import type { Task, TaskInput, FilterType } from "./types";

// Environment variables (non-rahasia)
const appName: string = import.meta.env.VITE_APP_NAME ?? "Daftar Tugas";
const appVersion: string = import.meta.env.VITE_APP_VERSION ?? "0.0.0";
const courseName: string = import.meta.env.VITE_COURSE_NAME ?? "Mata Kuliah";
const userName: string = import.meta.env.VITE_USER_NAME ?? "Ahmad Riyadh Fawwaz";
const userRole: string = import.meta.env.VITE_USER_ROLE ?? "1247050114";

// Primitive types + array
const STORAGE_KEY: string = "tugas-kuliah-v2";
const TOTAL_MEETINGS: number = 16;
const meetings: number[] = Array.from({ length: TOTAL_MEETINGS }, (_, i) => i + 1);

// Contoh data awal (hanya sekali, boleh dihapus lewat tombol Hapus)
const seedTasks: Task[] = [
  { id: 1, title: "Upload domain ke website pribadi", meeting: 1, deadline: "2026-11-08", status: "Selesai" },
  { id: 2, title: "Membuat aplikasi todo dengan Vite + TypeScript", meeting: 2, deadline: "2026-11-12", status: "Belum Selesai" },
  { id: 3, title: "Latihan Git: branch, merge, dan pull request", meeting: 3, deadline: "2026-11-15", status: "Belum Selesai" },
];
let tasks: Task[] = load<Task[]>(STORAGE_KEY, []);
if (!load<boolean>("seeded-v2", false)) {
  if (tasks.length === 0) tasks = seedTasks;
  save<Task[]>(STORAGE_KEY, tasks);
  save<boolean>("seeded-v2", true);
}

let editingId: number | null = null;
let filter: FilterType = "Semua";
const openGroups = new Set<number>([1]);

// Generics: kelompokkan array berdasarkan kunci apa pun
function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <aside class="sidebar">
    <div class="brand">📚 <span>Tugasku</span></div>
    <nav>
      <a href="#">▦ Dashboard</a>
      <a href="#" class="active">▤ Tugasku</a>
      <a href="#">⎋ Sign Out</a>
    </nav>
    <small class="ver">v${appVersion}</small>
  </aside>
  <div class="right">
    <div class="topbar">
      <button class="icon-btn" id="burger" aria-label="Menu">☰</button>
      <div class="top-title"><small id="today"></small><strong>${appName}</strong></div>
      <button class="icon-btn" id="theme" aria-label="Mode gelap">🌙</button>
      <div class="user"><span>${userName}</span><small>${userRole}</small></div>
    </div>
    <div class="content">
      <h1>${courseName}</h1>
      <p class="crumb">Beranda › Tugasku › Daftar Tugas</p>
      <section class="panel">
        <div class="acc open" id="form-acc">
          <button class="acc-head" data-toggle-form><span class="chev">›</span><span id="form-title">Tambah Tugas</span></button>
          <div class="acc-body">
            <form id="form">
              <input id="title" placeholder="Judul tugas" required />
              <select id="meeting" required>
                ${meetings.map((m) => `<option value="${m}">Pertemuan ${m}</option>`).join("")}
              </select>
              <input id="deadline" type="date" required />
              <button type="submit" id="submit" class="btn">Tambah</button>
              <button type="button" id="cancel" class="btn ghost" hidden>Batal</button>
            </form>
          </div>
        </div>
        <div class="filters" id="filters"></div>
        <div id="list"></div>
      </section>
    </div>
    <footer>© 2026 ${appName} v${appVersion}</footer>
  </div>
`;

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
$("today").textContent = new Date().toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long",
});

// Tema gelap & sidebar
let dark: boolean = load<boolean>("dark", false);
const applyTheme = (): void => {
  document.body.classList.toggle("dark", dark);
  $("theme").textContent = dark ? "☀️" : "🌙";
};
applyTheme();
$("theme").addEventListener("click", () => { dark = !dark; save<boolean>("dark", dark); applyTheme(); });
$("burger").addEventListener("click", () => app.classList.toggle("no-sidebar"));
if (window.innerWidth < 800) app.classList.add("no-sidebar");

function persist(): void {
  save<Task[]>(STORAGE_KEY, tasks);
  render();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const fmtDate = (d: string): string =>
  new Date(d + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

function addTask(input: TaskInput): void {
  tasks.push({ id: Date.now(), status: "Belum Selesai", ...input });
  openGroups.add(input.meeting);
  persist();
}

function updateTask(id: number, input: TaskInput): void {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...input } : t));
  openGroups.add(input.meeting);
  persist();
}

function toggleStatus(id: number): void {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, status: t.status === "Selesai" ? "Belum Selesai" : "Selesai" } : t);
  persist();
}

function deleteTask(id: number): void {
  if (!confirm("Hapus tugas ini?")) return;
  tasks = tasks.filter((t) => t.id !== id);
  persist();
}

function render(): void {
  const filters: FilterType[] = ["Semua", "Belum Selesai", "Selesai"];
  $("filters").innerHTML = filters
    .map((f) => `<button class="chip ${f === filter ? "on" : ""}" data-filter="${f}">${f}</button>`)
    .join("");

  const shown = tasks.filter((t) => filter === "Semua" || t.status === filter);
  const byMeeting = groupBy(shown, (t) => t.meeting);

  $("list").innerHTML = meetings.map((m) => {
    const items = byMeeting.get(m) ?? [];
    return `
      <div class="acc ${openGroups.has(m) ? "open" : ""}">
        <button class="acc-head" data-group="${m}">
          <span class="chev">›</span>Pertemuan ${m}
          <span class="count">${items.length} tugas</span>
        </button>
        <div class="acc-body">
          ${items.length ? items.map((t) => `
            <div class="row ${t.status === "Selesai" ? "done" : ""}">
              <button class="ico" data-act="toggle" data-id="${t.id}" title="Ubah status">${t.status === "Selesai" ? "☑" : "☐"}</button>
              <span class="r-title">${escapeHtml(t.title)}</span>
              <span class="r-meta">Tenggat ${fmtDate(t.deadline)}</span>
              <span class="badge ${t.status === "Selesai" ? "ok" : "wait"}">${t.status}</span>
              <span class="actions">
                <button class="link" data-act="edit" data-id="${t.id}">Edit</button>
                <button class="link danger" data-act="delete" data-id="${t.id}">Hapus</button>
              </span>
            </div>`).join("") : `<p class="empty">Belum ada tugas.</p>`}
        </div>
      </div>`;
  }).join("");
}

function resetForm(): void {
  editingId = null;
  ($("form") as HTMLFormElement).reset();
  $("form-title").textContent = "Tambah Tugas";
  $("submit").textContent = "Tambah";
  $("cancel").hidden = true;
}

$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input: TaskInput = {
    title: $<HTMLInputElement>("title").value.trim(),
    meeting: Number($<HTMLSelectElement>("meeting").value),
    deadline: $<HTMLInputElement>("deadline").value,
  };
  if (editingId === null) addTask(input);
  else updateTask(editingId, input);
  resetForm();
});

$("cancel").addEventListener("click", resetForm);
$("form-acc").querySelector("[data-toggle-form]")!.addEventListener("click", () =>
  $("form-acc").classList.toggle("open"));

$("filters").addEventListener("click", (e) => {
  const f = (e.target as HTMLElement).dataset.filter as FilterType | undefined;
  if (f) { filter = f; render(); }
});

$("list").addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act],[data-group]");
  if (!el) return;
  if (el.dataset.group !== undefined) {
    const g = Number(el.dataset.group);
    openGroups.has(g) ? openGroups.delete(g) : openGroups.add(g);
    el.parentElement!.classList.toggle("open");
    return;
  }
  const id = Number(el.dataset.id);
  if (el.dataset.act === "toggle") toggleStatus(id);
  if (el.dataset.act === "delete") deleteTask(id);
  if (el.dataset.act === "edit") {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    $<HTMLInputElement>("title").value = t.title;
    $<HTMLSelectElement>("meeting").value = String(t.meeting);
    $<HTMLInputElement>("deadline").value = t.deadline;
    $("form-title").textContent = "Edit Tugas";
    $("submit").textContent = "Simpan";
    $("cancel").hidden = false;
    $("form-acc").classList.add("open");
    document.querySelector(".content")!.scrollTo({ top: 0, behavior: "smooth" });
  }
});

render();