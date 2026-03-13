// players.js — إدارة اللاعبين مع slider + half-star display

import { db } from "./firebase-config.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ===== STATE =====
let allPlayers = [];
let deleteTargetId = null;

// ===== DOM =====
const playersList  = document.getElementById("players-list");
const totalBadge   = document.getElementById("total-badge");
const searchInput  = document.getElementById("search-players");
const newNameInput = document.getElementById("new-name");
const newRating    = document.getElementById("new-rating");
const newSlider    = document.getElementById("new-slider");
const newStarsDisp = document.getElementById("new-stars-display");
const addBtn       = document.getElementById("add-btn");
const modal        = document.getElementById("modal");
const editName     = document.getElementById("edit-name");
const editRating   = document.getElementById("edit-rating");
const editSlider   = document.getElementById("edit-slider");
const editStarsDisp= document.getElementById("edit-stars-display");
const editId       = document.getElementById("edit-id");
const cancelEdit   = document.getElementById("cancel-edit");
const saveEdit     = document.getElementById("save-edit");
const confirmModal = document.getElementById("confirm-modal");
const confirmMsg   = document.getElementById("confirm-msg");
const cancelDelete = document.getElementById("cancel-delete");
const confirmDelete= document.getElementById("confirm-delete");

// ===== STARS DISPLAY =====
function starsHtml(r) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    if (r >= i)
      s += `<span class="s-full">★</span>`;
    else if (r >= i - 0.5)
      s += `<span class="s-half">★</span>`;
    else
      s += `<span class="s-empty">★</span>`;
  }
  return `<span class="stars-wrap">${s}</span> <span class="stars-num">${r}</span>`;
}

// ===== SLIDER INIT =====
function initSlider(slider, hiddenInput, display, initVal) {
  slider.value = initVal;
  hiddenInput.value = initVal;
  display.innerHTML = starsHtml(initVal);

  slider.addEventListener("input", () => {
    const val = parseFloat(slider.value);
    hiddenInput.value = val;
    display.innerHTML = starsHtml(val);
  });
}

initSlider(newSlider, newRating, newStarsDisp, 3);
initSlider(editSlider, editRating, editStarsDisp, 3);

// ===== LOAD PLAYERS =====
const q = query(collection(db, "players"), orderBy("name"));
onSnapshot(q, (snapshot) => {
  allPlayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  totalBadge.textContent = allPlayers.length + " لاعب";
  renderList(allPlayers);
});

// ===== RENDER LIST =====
function renderList(players) {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = keyword
    ? players.filter(p => p.name.toLowerCase().includes(keyword))
    : players;

  if (filtered.length === 0) {
    playersList.innerHTML = `<div class="empty">${keyword ? "😕 مفيش لاعب بالاسم ده" : "😕 مفيش لاعبين بعد"}</div>`;
    return;
  }

  playersList.innerHTML = "";
  filtered.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.style.animationDelay = i * 0.05 + "s";
    row.innerHTML = `
      <span class="pr-name">${p.name}</span>
      <span class="pr-stars">${starsHtml(p.rating)}</span>
      <div class="pr-actions">
        <button class="btn-icon" data-id="${p.id}" data-action="edit">✏️ تعديل</button>
        <button class="btn-icon del" data-id="${p.id}" data-action="delete" data-name="${p.name}">🗑️</button>
      </div>`;
    playersList.appendChild(row);
  });
}

// ✅ listener واحد ثابت
playersList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { id, action, name } = btn.dataset;

  if (action === "edit") {
    const player = allPlayers.find(p => p.id === id);
    if (!player) return;
    editId.value = id;
    editName.value = player.name;
    editSlider.value = player.rating;
    editRating.value = player.rating;
    editStarsDisp.innerHTML = starsHtml(player.rating);
    modal.classList.remove("hidden");
  }

  if (action === "delete") {
    deleteTargetId = id;
    confirmMsg.textContent = `متأكد إنك عايز تحذف "${name}"؟`;
    confirmModal.classList.remove("hidden");
  }
});

// ===== SEARCH =====
searchInput.addEventListener("input", () => renderList(allPlayers));

// ===== ADD =====
addBtn.addEventListener("click", async () => {
  const name   = newNameInput.value.trim();
  const rating = parseFloat(newRating.value);
  if (!name)   { showToast("⚠️ اكتب اسم اللاعب أولاً"); return; }
  addBtn.disabled = true;
  try {
    await addDoc(collection(db, "players"), { name, rating });
    newNameInput.value = "";
    newSlider.value = 3;
    newRating.value = 3;
    newStarsDisp.innerHTML = starsHtml(3);
    showToast("✅ تم إضافة " + name);
  } catch (err) { showToast("❌ حصل خطأ: " + err.message); }
  finally { addBtn.disabled = false; }
});

newNameInput.addEventListener("keydown", e => { if (e.key === "Enter") addBtn.click(); });

// ===== EDIT =====
cancelEdit.addEventListener("click", () => modal.classList.add("hidden"));
saveEdit.addEventListener("click", async () => {
  const id     = editId.value;
  const name   = editName.value.trim();
  const rating = parseFloat(editRating.value);
  if (!name) { showToast("⚠️ اكتب اسم اللاعب"); return; }
  saveEdit.disabled = true;
  try {
    await updateDoc(doc(db, "players", id), { name, rating });
    modal.classList.add("hidden");
    showToast("✅ تم التعديل");
  } catch (err) { showToast("❌ حصل خطأ: " + err.message); }
  finally { saveEdit.disabled = false; }
});

// ===== DELETE =====
cancelDelete.addEventListener("click", () => { confirmModal.classList.add("hidden"); deleteTargetId = null; });
confirmDelete.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  confirmDelete.disabled = true;
  try {
    await deleteDoc(doc(db, "players", deleteTargetId));
    confirmModal.classList.add("hidden");
    deleteTargetId = null;
    showToast("🗑️ تم الحذف");
  } catch (err) { showToast("❌ حصل خطأ: " + err.message); }
  finally { confirmDelete.disabled = false; }
});

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
