import React, { useState, useEffect, useCallback, useRef } from "react";
import { Coffee, Plus, Minus, X, ShoppingBag, Check, ChefHat, Clock, ArrowLeft, Settings, Trash2, Pencil, RefreshCw, BarChart2 } from "lucide-react";

/* ---------------------------------------------------------
   FIVIS CAFÉ — QR ordering
   Customer view: browse menu in 6 languages, build an order
   Barista view: live ticket queue in Thai, on a tablet
   Data: Supabase (REST API) — orders + menu persist for real, across devices
--------------------------------------------------------- */

const LANGS = {
  en: { label: "English", flag: "🇬🇧" },
  th: { label: "ไทย", flag: "🇹🇭" },
  zh: { label: "中文", flag: "🇨🇳" },
  ru: { label: "Русский", flag: "🇷🇺" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  fr: { label: "Français", flag: "🇫🇷" },
};

const UI = {
  tagline: { en: "Every day, 7AM – 5PM", th: "ทุกวัน 7:00 - 17:00 น.", zh: "每天 7:00 - 17:00", ru: "Ежедневно, 7:00–17:00", de: "Täglich, 7–17 Uhr", fr: "Tous les jours, 7h–17h" },
  tableLabel: { en: "Table number", th: "หมายเลขโต๊ะ", zh: "桌号", ru: "Номер столика", de: "Tischnummer", fr: "Numéro de table" },
  tablePlaceholder: { en: "e.g. 4", th: "เช่น 4", zh: "例如 4", ru: "напр. 4", de: "z. B. 4", fr: "ex. 4" },
  addToOrder: { en: "Add to order", th: "เพิ่มลงในออเดอร์", zh: "加入订单", ru: "Добавить в заказ", de: "Zur Bestellung hinzufügen", fr: "Ajouter à la commande" },
  milk: { en: "Milk", th: "นม", zh: "牛奶", ru: "Молоко", de: "Milch", fr: "Lait" },
  regularMilk: { en: "Regular milk", th: "นมปกติ", zh: "普通牛奶", ru: "Обычное молоко", de: "Normale Milch", fr: "Lait classique" },
  extraShot: { en: "Extra shot", th: "เพิ่มช็อต", zh: "加一份浓缩", ru: "Доп. эспрессо", de: "Extra Shot", fr: "Shot supplémentaire" },
  sweetness: { en: "Sweetness", th: "ความหวาน", zh: "甜度", ru: "Сладость", de: "Süße", fr: "Taux de sucre" },
  notes: { en: "Notes (optional)", th: "หมายเหตุ (ถ้ามี)", zh: "备注（可选）", ru: "Комментарий (необязательно)", de: "Hinweise (optional)", fr: "Remarques (facultatif)" },
  notesPlaceholder: { en: "e.g. less sweet, no ice...", th: "เช่น หวานน้อย ไม่ใส่น้ำแข็ง", zh: "例如：少糖、去冰", ru: "напр. менее сладко, без льда", de: "z. B. weniger süß, ohne Eis", fr: "ex. moins sucré, sans glace" },
  yourOrder: { en: "Your order", th: "ออเดอร์ของคุณ", zh: "您的订单", ru: "Ваш заказ", de: "Ihre Bestellung", fr: "Votre commande" },
  emptyCart: { en: "Your cart is empty. Tap an item to add it.", th: "ตะกร้าว่างเปล่า แตะเมนูเพื่อเพิ่ม", zh: "购物车为空，点击商品添加", ru: "Корзина пуста. Нажмите на товар, чтобы добавить.", de: "Ihr Warenkorb ist leer. Tippen Sie auf ein Produkt.", fr: "Votre panier est vide. Touchez un article pour l'ajouter." },
  total: { en: "Total", th: "ยอดรวม", zh: "总计", ru: "Итого", de: "Gesamt", fr: "Total" },
  placeOrder: { en: "Place order", th: "สั่งออเดอร์", zh: "下单", ru: "Оформить заказ", de: "Bestellung aufgeben", fr: "Passer la commande" },
  viewCart: { en: "View order", th: "ดูออเดอร์", zh: "查看订单", ru: "Посмотреть заказ", de: "Bestellung ansehen", fr: "Voir la commande" },
  backToMenu: { en: "Back to menu", th: "กลับไปที่เมนู", zh: "返回菜单", ru: "Назад в меню", de: "Zurück zur Speisekarte", fr: "Retour au menu" },
  enterTableFirst: { en: "Please enter your table number", th: "กรุณาใส่หมายเลขโต๊ะ", zh: "请输入桌号", ru: "Укажите номер столика", de: "Bitte Tischnummer eingeben", fr: "Veuillez indiquer votre table" },
  orderSent: { en: "Order sent!", th: "ส่งออเดอร์แล้ว!", zh: "订单已发送！", ru: "Заказ отправлен!", de: "Bestellung gesendet!", fr: "Commande envoyée !" },
  orderSentSub: { en: "The barista has your order. Sit back and relax — we'll bring it over.", th: "บาริสต้าได้รับออเดอร์แล้ว นั่งรอสักครู่นะคะ", zh: "咖啡师已收到您的订单，请稍候片刻。", ru: "Бариста получил ваш заказ. Немного подождите.", de: "Der Barista hat Ihre Bestellung. Bitte warten Sie kurz.", fr: "Le barista a reçu votre commande. Patientez un instant." },
  newOrder: { en: "Start a new order", th: "สั่งออเดอร์ใหม่", zh: "开始新订单", ru: "Новый заказ", de: "Neue Bestellung", fr: "Nouvelle commande" },
  staff: { en: "Staff", th: "พนักงาน", zh: "员工", ru: "Персонал", de: "Personal", fr: "Personnel" },
  each: { en: "ea.", th: "/แก้ว", zh: "每份", ru: "за шт.", de: "/Stk.", fr: "/unité" },
};

const CATEGORY_NAMES = {
  hot: { en: "Hot Coffee", th: "กาแฟร้อน", zh: "热咖啡", ru: "Горячий кофе", de: "Heißer Kaffee", fr: "Café chaud" },
  iced: { en: "Iced Coffee", th: "กาแฟเย็น", zh: "冰咖啡", ru: "Холодный кофе", de: "Eiskaffee", fr: "Café glacé" },
  other: { en: "Other Drinks", th: "เครื่องดื่มอื่นๆ", zh: "其他饮品", ru: "Другие напитки", de: "Andere Getränke", fr: "Autres boissons" },
};

const MILK_OPTIONS = [
  { id: "regular", price: 0, name: { en: "Regular milk", th: "นมปกติ", zh: "普通牛奶", ru: "Обычное молоко", de: "Normale Milch", fr: "Lait classique" } },
  { id: "oat", price: 20, name: { en: "Oat milk", th: "นมโอ๊ต", zh: "燕麦奶", ru: "Овсяное молоко", de: "Hafermilch", fr: "Lait d'avoine" } },
  { id: "almond", price: 30, name: { en: "Almond milk", th: "นมอัลมอนด์", zh: "杏仁奶", ru: "Миндальное молоко", de: "Mandelmilch", fr: "Lait d'amande" } },
  { id: "coconut", price: 30, name: { en: "Coconut milk", th: "นมมะพร้าว", zh: "椰奶", ru: "Кокосовое молоко", de: "Kokosmilch", fr: "Lait de coco" } },
];
const EXTRA_SHOT_PRICE = 30;

const SWEETNESS_OPTIONS = [
  { id: "0", label: { en: "No sweet", th: "ไม่หวาน", zh: "无糖", ru: "Без сахара", de: "Ohne Süße", fr: "Sans sucre" } },
  { id: "25", label: { en: "25%", th: "หวานน้อย 25%", zh: "25%", ru: "25%", de: "25 %", fr: "25 %" } },
  { id: "50", label: { en: "50%", th: "หวานปานกลาง 50%", zh: "50%", ru: "50%", de: "50 %", fr: "50 %" } },
  { id: "75", label: { en: "75%", th: "หวาน 75%", zh: "75%", ru: "75%", de: "75 %", fr: "75 %" } },
  { id: "100", label: { en: "100%", th: "หวานปกติ 100%", zh: "100%（正常）", ru: "100% (обычная)", de: "100 % (normal)", fr: "100 % (normal)" } },
];
const DEFAULT_SWEETNESS = "100";

const DEFAULT_MENU = {
  hot: [
    { id: "h1", en: "Americano", th: "อเมริกาโน่", price: 60 },
    { id: "h2", en: "Long Black", th: "ลองแบล็ค", price: 60 },
    { id: "h3", en: "Espresso", th: "เอสเพรสโซ่", price: 50 },
    { id: "h4", en: "Macchiato", th: "มัคคิอาโต้", price: 60 },
    { id: "h5", en: "Latte", th: "ลาเต้", price: 60 },
    { id: "h6", en: "Cappuccino", th: "คาปูชิโน่", price: 70 },
    { id: "h7", en: "Flat White", th: "แฟลทไวท์", price: 70 },
    { id: "h8", en: "Mocha", th: "มอคค่า", price: 70 },
    { id: "h9", en: "Cortado", th: "คอร์ตาโด้", price: 60 },
    { id: "h10", en: "Piccolo", th: "ปิคโคโล่", price: 60 },
  ],
  iced: [
    { id: "i1", en: "Iced Americano", th: "อเมริกาโน่เย็น", price: 60 },
    { id: "i2", en: "Iced Long Black", th: "ลองแบล็คเย็น", price: 60 },
    { id: "i3", en: "Honey Americano", th: "อเมริกาโน่น้ำผึ้ง", price: 80 },
    { id: "i4", en: "Coconut Americano", th: "อเมริกาโน่มะพร้าว", price: 90 },
    { id: "i5", en: "Iced Espresso", th: "เอสเพรสโซ่เย็น", price: 60 },
    { id: "i6", en: "Iced Mocha", th: "มอคค่าเย็น", price: 80 },
    { id: "i7", en: "Caramel Macchiato", th: "คาราเมล มัคคิอาโต้", price: 80 },
    { id: "i8", en: "Iced Latte", th: "ลาเต้เย็น", price: 70 },
    { id: "i9", en: "Iced Cappuccino", th: "คาปูชิโน่เย็น", price: 70 },
    { id: "i10", en: "Freddo Espresso", th: "เฟรโด้ เอสเพรสโซ่", price: 60 },
    { id: "i11", en: "Freddo Cappuccino", th: "เฟรโด้ คาปูชิโน่", price: 80 },
    { id: "i12", en: "Affogato", th: "อโฟกาโต้", price: 90 },
  ],
  other: [
    { id: "o1", en: "Thai Tea", th: "ชาไทย", price: 50 },
    { id: "o2", en: "Iced Cacao", th: "ไอซ์โกโก้", price: 60 },
    { id: "o3", en: "Matcha Latte", th: "มัทฉะ ลาเต้", price: 60 },
    { id: "o4", en: "Pure Matcha Coconut", th: "มัทฉะมะพร้าวแท้", price: 90 },
    { id: "o5", en: "Tea", th: "ชา", price: 50 },
    { id: "o6", en: "Baby Chino", th: "เบบี้ชิโน่", price: 70 },
    { id: "o7", en: "Coconut", th: "มะพร้าว", price: 50 },
  ],
};

const STAFF_PIN = "1234";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function moneyTHB(n) {
  return `฿${n}`;
}

function timeAgo(ts, lang) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return lang === "th" ? "เมื่อสักครู่" : "just now";
  return `${mins} min`;
}

/* ---------------- Supabase REST client (replaces prototype storage) --- */
const SUPABASE_URL = "https://wexxwzfkunjszzlgjxth.supabase.co";
const SUPABASE_KEY = "sb_publishable_3jgRpCddfKVpU69kOKH4Ug_KdOkaRsj";

async function sb(path, options = {}) {
  try {
    const method = options.method || "GET";
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (method === "POST") {
      headers["Prefer"] = options.prefer || "return=representation";
    } else if (method === "PATCH" || method === "DELETE") {
      headers["Prefer"] = "return=minimal";
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      method,
      headers,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase error", res.status, errText);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  } catch (e) {
    console.error("Supabase request failed", e);
    return null;
  }
}

async function fetchMenuRows() {
  const rows = await sb("menu?select=*&order=sort_order.asc");
  return rows || [];
}
async function upsertMenuRows(rows) {
  return sb("menu", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify(rows),
  });
}
async function deleteMenuRow(id) {
  return sb(`menu?id=eq.${id}`, { method: "DELETE" });
}

async function fetchActiveOrders() {
  const rows = await sb("orders?select=*&status=neq.served&order=created_at.asc");
  return rows || [];
}
async function insertOrder(order) {
  return sb("orders", { method: "POST", body: JSON.stringify([order]) });
}
async function updateOrderStatus(id, status) {
  return sb(`orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}
async function deleteOrder(id) {
  return sb(`orders?id=eq.${id}`, { method: "DELETE" });
}

/* ================================================================== */

export default function App() {
  const [view, setView] = useState("menu"); // menu | cart | confirmed | staffLogin | barista | editMenu
  const [lang, setLang] = useState("en");
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [cart, setCart] = useState([]);
  const [activeItem, setActiveItem] = useState(null); // item being customized
  const [lastOrderId, setLastOrderId] = useState(null);
  const [storageOk, setStorageOk] = useState(true);

  // load menu once, from Supabase
  useEffect(() => {
    (async () => {
      const rows = await fetchMenuRows();
      if (rows && rows.length > 0) {
        const grouped = { hot: [], iced: [], other: [] };
        rows.forEach((r) => {
          if (!grouped[r.category]) grouped[r.category] = [];
          grouped[r.category].push({ id: r.id, en: r.name_en, th: r.name_th, price: r.price });
        });
        setMenu(grouped);
      } else {
        // Supabase empty or unreachable — seed it from the default menu so it's not blank next time
        const flat = Object.entries(DEFAULT_MENU).flatMap(([cat, items]) =>
          items.map((it, i) => ({ id: it.id, category: cat, name_en: it.en, name_th: it.th, price: it.price, sort_order: i }))
        );
        await upsertMenuRows(flat);
        setMenu(DEFAULT_MENU);
      }
      setMenuLoaded(true);
    })();
  }, []);

  const t = (dict) => dict[lang] || dict.en;

  const cartTotal = cart.reduce((sum, c) => sum + c.unitPrice * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const addToCart = (entry) => {
    setCart((prev) => [...prev, entry]);
    setActiveItem(null);
  };
  const removeFromCart = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));
  const changeQty = (idx, delta) =>
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, qty: Math.max(1, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );

  const submitOrder = async () => {
    const id = uid();
    const order = {
      id,
      table_number: "—",
      lang,
      items: cart.map((c) => ({
        en: c.en,
        th: c.th,
        qty: c.qty,
        unitPrice: c.unitPrice,
        milk: c.milk,
        sweetness: c.sweetness,
        extraShot: c.extraShot,
        notes: c.notes,
      })),
      total: cartTotal,
      status: "new",
    };
    await insertOrder(order);
    setLastOrderId(id);
    setCart([]);
    setView("confirmed");
  };

  if (!menuLoaded) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Coffee size={28} color="#9b6b3f" />
      </div>
    );
  }

  if (view === "barista" || view === "editMenu" || view === "staffLogin" || view === "stats") {
    return (
      <StaffArea
        view={view}
        setView={setView}
        menu={menu}
        setMenu={setMenu}
      />
    );
  }

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <Header lang={lang} setLang={setLang} onStaff={() => setView("staffLogin")} t={t} />

      {view === "menu" && (
        <MenuView
          menu={menu}
          lang={lang}
          t={t}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          addToCart={addToCart}
        />
      )}

      {view === "cart" && (
        <CartView
          cart={cart}
          lang={lang}
          t={t}
          changeQty={changeQty}
          removeFromCart={removeFromCart}
          cartTotal={cartTotal}
          onBack={() => setView("menu")}
          onSubmit={submitOrder}
        />
      )}

      {view === "confirmed" && (
        <ConfirmedView
          t={t}
          onNew={() => {
            setCart([]);
            setView("menu");
            window.scrollTo(0, 0);
          }}
        />
      )}

      {view !== "cart" && view !== "confirmed" && cartCount > 0 && (
        <button style={styles.cartBar} onClick={() => setView("cart")}>
          <ShoppingBag size={18} />
          <span>{t(UI.viewCart)}</span>
          <span style={styles.cartBarBadge}>{cartCount}</span>
          <span style={{ marginLeft: "auto", fontWeight: 700 }}>{moneyTHB(cartTotal)}</span>
        </button>
      )}
    </div>
  );
}

/* ---------------------------- Header --------------------------------- */
function Header({ lang, setLang, onStaff, t }) {
  return (
    <div style={styles.header}>
      <div style={styles.headerTop}>
        <div style={styles.brandWrap}>
          <div style={styles.brandMark}>F</div>
          <div>
            <div style={styles.brandName}>Fivis Café</div>
            <div style={styles.brandTag}>{t(UI.tagline)}</div>
          </div>
        </div>
        <button style={styles.staffBtn} onClick={onStaff} title={t(UI.staff)}>
          <Settings size={16} />
        </button>
      </div>
      <div style={styles.langRow}>
        {Object.entries(LANGS).map(([code, info]) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            style={{
              ...styles.langChip,
              ...(lang === code ? styles.langChipActive : {}),
            }}
          >
            <span style={{ marginRight: 5 }}>{info.flag}</span>
            {info.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Menu view -------------------------------- */
function MenuView({ menu, lang, t, activeItem, setActiveItem, addToCart }) {
  return (
    <div style={styles.body}>
      {Object.entries(menu).map(([catKey, items]) => (
        <div key={catKey} style={{ marginBottom: 28 }}>
          <div style={styles.categoryTitle}>{t(CATEGORY_NAMES[catKey] || { en: catKey })}</div>
          <div style={styles.itemGrid}>
            {items.map((item) => (
              <button key={item.id} style={styles.itemCard} onClick={() => setActiveItem({ ...item, catKey })}>
                <div style={styles.itemNameEn}>{item.en}</div>
                {lang !== "en" && <div style={styles.itemNameTh}>{item.th}</div>}
                <div style={styles.itemPrice}>{moneyTHB(item.price)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {activeItem && (
        <ItemModal item={activeItem} lang={lang} t={t} onClose={() => setActiveItem(null)} onAdd={addToCart} />
      )}
    </div>
  );
}

function ItemModal({ item, lang, t, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [milk, setMilk] = useState(MILK_OPTIONS[0]);
  const [sweetness, setSweetness] = useState(SWEETNESS_OPTIONS.find((s) => s.id === DEFAULT_SWEETNESS));
  const [extraShot, setExtraShot] = useState(false);
  const [notes, setNotes] = useState("");

  const isCoffee = item.catKey === "hot" || item.catKey === "iced";
  const unitPrice = item.price + (isCoffee ? milk.price : 0) + (extraShot ? EXTRA_SHOT_PRICE : 0);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHandle} />
        <div style={styles.modalHeaderRow}>
          <div>
            <div style={styles.modalTitle}>{item.en}</div>
            {lang !== "en" && <div style={styles.modalSubtitle}>{item.th}</div>}
          </div>
          <button style={styles.iconBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {isCoffee && (
          <div style={{ marginBottom: 18 }}>
            <div style={styles.fieldLabel}>{t(UI.milk)}</div>
            <div style={styles.optionList}>
              {MILK_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMilk(m)}
                  style={{ ...styles.optionRow, ...(milk.id === m.id ? styles.optionRowActive : {}) }}
                >
                  <span>{t(m.name)}</span>
                  <span style={{ color: "#8a6a4a" }}>{m.price > 0 ? `+${moneyTHB(m.price)}` : ""}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={styles.fieldLabel}>{t(UI.sweetness)}</div>
          <div style={styles.optionList}>
            {SWEETNESS_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSweetness(s)}
                style={{ ...styles.optionRow, ...(sweetness.id === s.id ? styles.optionRowActive : {}) }}
              >
                <span>{t(s.label)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setExtraShot((s) => !s)}
          style={{ ...styles.toggleRow, ...(extraShot ? styles.toggleRowActive : {}) }}
        >
          <span style={styles.checkbox}>{extraShot && <Check size={13} color="#fff" />}</span>
          <span style={{ flex: 1, textAlign: "left" }}>{t(UI.extraShot)}</span>
          <span style={{ color: "#8a6a4a" }}>+{moneyTHB(EXTRA_SHOT_PRICE)}</span>
        </button>


        <div style={{ margin: "16px 0" }}>
          <div style={styles.fieldLabel}>{t(UI.notes)}</div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(UI.notesPlaceholder)}
            style={styles.textInput}
          />
        </div>

        <div style={styles.modalFooter}>
          <div style={styles.qtyStepper}>
            <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={14} />
            </button>
            <span style={{ width: 22, textAlign: "center", fontWeight: 700 }}>{qty}</span>
            <button style={styles.qtyBtn} onClick={() => setQty((q) => q + 1)}>
              <Plus size={14} />
            </button>
          </div>
          <button
            style={styles.primaryBtn}
            onClick={() =>
              onAdd({
                en: item.en,
                th: item.th,
                unitPrice,
                qty,
                milk: isCoffee ? milk.id : null,
                milkLabel: isCoffee ? t(milk.name) : null,
                sweetness: sweetness.id,
                sweetnessLabel: t(sweetness.label),
                extraShot,
                notes: notes.trim(),
              })
            }
          >
            {t(UI.addToOrder)} · {moneyTHB(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Cart view -------------------------------- */
function CartView({ cart, lang, t, changeQty, removeFromCart, cartTotal, onBack, onSubmit }) {
  return (
    <div style={styles.body}>
      <button style={styles.backLink} onClick={onBack}>
        <ArrowLeft size={16} /> {t(UI.backToMenu)}
      </button>
      <div style={styles.sectionTitle}>{t(UI.yourOrder)}</div>

      {cart.length === 0 ? (
        <div style={styles.emptyState}>{t(UI.emptyCart)}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cart.map((c, idx) => (
            <div key={idx} style={styles.cartRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.itemNameEn}>{c.en}</div>
                <div style={{ fontSize: 12.5, color: "#9a8770", marginTop: 2 }}>
                  {[c.milkLabel, c.sweetnessLabel, c.extraShot ? t(UI.extraShot) : null].filter(Boolean).join(" · ")}
                </div>
                {c.notes && <div style={{ fontSize: 12.5, color: "#9a8770", fontStyle: "italic" }}>"{c.notes}"</div>}
                <div style={{ fontSize: 13, color: "#5d4a34", marginTop: 4 }}>{moneyTHB(c.unitPrice)} {t(UI.each)}</div>
              </div>
              <div style={styles.qtyStepper}>
                <button style={styles.qtyBtn} onClick={() => changeQty(idx, -1)}>
                  <Minus size={13} />
                </button>
                <span style={{ width: 18, textAlign: "center", fontWeight: 700 }}>{c.qty}</span>
                <button style={styles.qtyBtn} onClick={() => changeQty(idx, 1)}>
                  <Plus size={13} />
                </button>
              </div>
              <button style={styles.trashBtn} onClick={() => removeFromCart(idx)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div style={styles.totalRow}>
            <span>{t(UI.total)}</span>
            <span style={{ fontWeight: 800, fontSize: 19 }}>{moneyTHB(cartTotal)}</span>
          </div>
          <button style={{ ...styles.primaryBtn, width: "100%", marginTop: 14 }} onClick={onSubmit}>
            {t(UI.placeOrder)}
          </button>
        </>
      )}
    </div>
  );
}

function ConfirmedView({ t, onNew }) {
  return (
    <div style={{ ...styles.body, textAlign: "center", paddingTop: 60 }}>
      <div style={styles.confirmBadge}>
        <Check size={30} color="#fff" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#3c2a18", marginTop: 18 }}>{t(UI.orderSent)}</div>
      <div style={{ color: "#8a7660", marginTop: 8, lineHeight: 1.5 }}>{t(UI.orderSentSub)}</div>
      <button style={{ ...styles.primaryBtn, marginTop: 28 }} onClick={onNew}>
        {t(UI.newOrder)}
      </button>
    </div>
  );
}

/* ============================ STAFF AREA =============================== */

const STAFF_AUTH_KEY = "fivis_staff_authed";

function StaffArea({ view, setView, menu, setMenu }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STAFF_AUTH_KEY) === "true");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // if already authed from localStorage and we just hit staffLogin, jump straight to barista
  useEffect(() => {
    if (authed && view === "staffLogin") setView("barista");
  }, [authed, view, setView]);

  const handleUnlock = () => {
    if (pin === STAFF_PIN) {
      localStorage.setItem(STAFF_AUTH_KEY, "true");
      setAuthed(true);
      setView("barista");
    } else {
      setPinError(true);
    }
  };

  const handleExit = () => {
    localStorage.removeItem(STAFF_AUTH_KEY);
    setAuthed(false);
    setView("menu");
  };

  if (view === "staffLogin" && !authed) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column" }}>
        <style>{globalCss}</style>
        <div style={{ ...styles.modalSheet, position: "static", maxWidth: 320, margin: "auto", borderRadius: 20 }}>
          <div style={styles.modalTitle}>Staff PIN</div>
          <input
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError(false);
            }}
            placeholder="••••"
            type="password"
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            style={{ ...styles.textInput, textAlign: "center", letterSpacing: 6, fontSize: 20, marginTop: 14 }}
          />
          {pinError && <div style={styles.errorText}>Incorrect PIN</div>}
          <button
            style={{ ...styles.primaryBtn, width: "100%", marginTop: 16 }}
            onClick={handleUnlock}
          >
            Unlock
          </button>
          <button style={{ ...styles.backLink, margin: "16px auto 0", justifyContent: "center" }} onClick={() => setView("menu")}>
            <ArrowLeft size={16} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (view === "editMenu") {
    return <EditMenuView menu={menu} setMenu={setMenu} onDone={() => setView("barista")} />;
  }

  if (view === "stats") {
    return <StatsView onBack={() => setView("barista")} />;
  }

  return <BaristaView onEditMenu={() => setView("editMenu")} onExit={handleExit} onStats={() => setView("stats")} />;
}

function sendNotification(count) {
  if (Notification.permission === "granted") {
    new Notification("Fivis Café — ออเดอร์ใหม่! 🔔", {
      body: `${count} ออเดอร์รอการทำ`,
      icon: "https://fivis-cafe.vercel.app/favicon.ico",
      tag: "new-order",
      renotify: true,
    });
  }
}

let _lastChimeTime = 0;
function playChime() {
  const now = Date.now();
  if (now - _lastChimeTime < 10000) return; // max once per 10 seconds
  _lastChimeTime = now;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {}
}

function BaristaView({ onEditMenu, onExit, onStats }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifAllowed, setNotifAllowed] = useState(Notification.permission);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const prevNewCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const rows = await fetchActiveOrders();
      if (rows === null) {
        setError("Connection error — retrying…");
        return;
      }
      setError(null);
      const valid = rows.map((r) => ({
        id: r.id,
        table: r.table_number,
        items: r.items,
        total: r.total,
        status: r.status,
        lang: r.lang,
        createdAt: new Date(r.created_at).getTime(),
      }));

      const newCount = valid.filter((o) => o.status === "new").length;
      if (newCount > prevNewCountRef.current) {
        playChime();
        sendNotification(newCount - prevNewCountRef.current);
      }
      prevNewCountRef.current = newCount;

      setOrders(valid);
      setLoading(false);
    } catch (e) {
      setError("Error loading orders");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => setNotifAllowed(p));
    }
    fetchOrders();
    timerRef.current = setInterval(fetchOrders, 3000);
    return () => clearInterval(timerRef.current);
  }, [fetchOrders]);

  const setStatus = async (order, status) => {
    const updated = { ...order, status };
    await updateOrderStatus(order.id, status);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    if (status === "served") {
      // keep in DB for statistics — just remove from the live board after a short delay
      setTimeout(() => {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      }, 800);
    }
  };

  const active = orders.filter((o) => o.status !== "served");

  return (
    <div style={{ ...styles.page, background: "#241a10", minHeight: "100vh" }}>
      <style>{globalCss}</style>
      <div style={styles.baristaHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ChefHat size={22} color="#f3e3c8" />
          <span style={{ color: "#f3e3c8", fontWeight: 800, fontSize: 18 }}>Barista — คำสั่งซื้อ</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.baristaTopBtn} onClick={fetchOrders}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button style={styles.baristaTopBtn} onClick={onStats}>
            <BarChart2 size={14} /> Stats
          </button>
          <button style={styles.baristaTopBtn} onClick={onEditMenu}>
            <Pencil size={14} /> Menu
          </button>
          <button style={styles.baristaTopBtn} onClick={onExit}>
            <X size={14} /> Exit
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#5a1a1a", color: "#f3c98a", fontSize: 13, padding: "8px 18px" }}>
          ⚠️ {error}
        </div>
      )}
        <div style={{ background: "#5a2a10", color: "#f3c98a", fontSize: 12.5, padding: "8px 18px" }}>
          🔕 การแจ้งเตือนถูกบล็อก — เปิดการแจ้งเตือนในการตั้งค่าเบราว์เซอร์เพื่อรับการแจ้งเตือน
        </div>
      )}
      {notifAllowed === "default" && (
        <div style={{ background: "#2a3a5a", color: "#a8c8f0", fontSize: 12.5, padding: "8px 18px" }}>
          🔔 กรุณาอนุญาตการแจ้งเตือนเพื่อรับแจ้งเมื่อมีออเดอร์ใหม่
        </div>
      )}

      <div style={styles.ticketGrid}>
        {loading && <div style={{ color: "#cbb89a" }}>Loading…</div>}
        {!loading && active.length === 0 && (
          <div style={{ color: "#cbb89a", padding: 30 }}>No active orders — รอออเดอร์ใหม่</div>
        )}
        {active.map((order) => (
          <div key={order.id} style={{ ...styles.ticket, ...(order.status === "new" ? styles.ticketNew : {}) }}>
            <div style={styles.ticketHeader}>
              <span style={styles.ticketTable}>ออเดอร์ใหม่</span>
              <span style={styles.ticketTime}>
                <Clock size={12} /> {timeAgo(order.createdAt, "th")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0" }}>
              {order.items.map((it, i) => (
                <div key={i} style={styles.ticketItem}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={styles.ticketItemTh}>{it.th} <span style={{ color: "#cbb89a", fontWeight: 600 }}>×{it.qty}</span></span>
                  </div>
                  <div style={{ fontSize: 12, color: "#a08a6c" }}>{it.en}</div>
                  {(it.milk && it.milk !== "regular") || it.extraShot || (it.sweetness && it.sweetness !== "100") || it.notes ? (
                    <div style={{ fontSize: 12.5, color: "#e8c98c", marginTop: 3 }}>
                      {[
                        it.milk && it.milk !== "regular" ? milkThai(it.milk) : null,
                        it.sweetness && it.sweetness !== "100" ? sweetnessThai(it.sweetness) : null,
                        it.extraShot ? "เพิ่มช็อต" : null,
                        it.notes ? `"${it.notes}"` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div style={styles.ticketFooter}>
              {order.status === "new" && (
                <button style={styles.ticketActionBtn} onClick={() => setStatus(order, "preparing")}>
                  เริ่มทำ
                </button>
              )}
              {order.status === "preparing" && (
                <button style={styles.ticketActionBtn} onClick={() => setStatus(order, "ready")}>
                  พร้อมเสิร์ฟ
                </button>
              )}
              {order.status === "ready" && (
                <button style={{ ...styles.ticketActionBtn, background: "#3a7d44" }} onClick={() => setStatus(order, "served")}>
                  <Check size={14} /> เสิร์ฟแล้ว
                </button>
              )}
              <span style={styles.ticketStatusTag}>{statusLabel(order.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function milkThai(id) {
  const m = MILK_OPTIONS.find((m) => m.id === id);
  return m ? m.name.th : "";
}
function sweetnessThai(id) {
  const s = SWEETNESS_OPTIONS.find((s) => s.id === id);
  return s ? s.label.th : "";
}
function statusLabel(s) {
  return { new: "ใหม่", preparing: "กำลังทำ", ready: "พร้อมเสิร์ฟ", served: "เสิร์ฟแล้ว" }[s] || s;
}

/* ---------------------------- Edit menu -------------------------------- */
function EditMenuView({ menu, setMenu, onDone }) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(menu)));
  const [saving, setSaving] = useState(false);

  const updateItem = (cat, idx, field, value) => {
    setDraft((d) => {
      const copy = { ...d, [cat]: [...d[cat]] };
      copy[cat][idx] = { ...copy[cat][idx], [field]: field === "price" ? Number(value) || 0 : value };
      return copy;
    });
  };
  const removeItem = (cat, idx) => {
    setDraft((d) => ({ ...d, [cat]: d[cat].filter((_, i) => i !== idx) }));
  };
  const addItem = (cat) => {
    setDraft((d) => ({ ...d, [cat]: [...d[cat], { id: uid(), en: "New item", th: "เมนูใหม่", price: 0 }] }));
  };

  const save = async () => {
    setSaving(true);
    const flat = Object.entries(draft).flatMap(([cat, items]) =>
      items.map((it, i) => ({ id: it.id, category: cat, name_en: it.en, name_th: it.th, price: it.price, sort_order: i }))
    );
    await upsertMenuRows(flat);

    // remove rows that existed before but were deleted in this edit
    const originalIds = new Set(Object.values(menu).flat().map((it) => it.id));
    const draftIds = new Set(flat.map((r) => r.id));
    const removedIds = [...originalIds].filter((id) => !draftIds.has(id));
    await Promise.all(removedIds.map((id) => deleteMenuRow(id)));

    setMenu(draft);
    setSaving(false);
    onDone();
  };

  return (
    <div style={{ ...styles.page, background: "#241a10", minHeight: "100vh" }}>
      <style>{globalCss}</style>
      <div style={styles.baristaHeader}>
        <span style={{ color: "#f3e3c8", fontWeight: 800, fontSize: 18 }}>Edit menu</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.baristaTopBtn} onClick={onDone}>
            <ArrowLeft size={14} /> Back
          </button>
          <button style={{ ...styles.baristaTopBtn, background: "#3a7d44" }} onClick={save} disabled={saving}>
            <Check size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div style={{ padding: "0 18px 40px" }}>
        {Object.entries(draft).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 26 }}>
            <div style={{ color: "#f3e3c8", fontWeight: 700, marginBottom: 10, fontSize: 15 }}>
              {(CATEGORY_NAMES[cat] && CATEGORY_NAMES[cat].en) || cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.id} style={styles.editRow}>
                  <input
                    value={item.en}
                    onChange={(e) => updateItem(cat, idx, "en", e.target.value)}
                    style={styles.editInput}
                    placeholder="English name"
                  />
                  <input
                    value={item.th}
                    onChange={(e) => updateItem(cat, idx, "th", e.target.value)}
                    style={{ ...styles.editInput, fontFamily: "inherit" }}
                    placeholder="ชื่อภาษาไทย"
                  />
                  <input
                    value={item.price}
                    onChange={(e) => updateItem(cat, idx, "price", e.target.value)}
                    style={{ ...styles.editInput, width: 70 }}
                    placeholder="฿"
                  />
                  <button style={styles.trashBtnDark} onClick={() => removeItem(cat, idx)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button style={styles.addItemBtn} onClick={() => addItem(cat)}>
              <Plus size={14} /> Add item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ STATS VIEW =============================== */

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

function getPeriodRange(id) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  let from, to;
  // tomorrow as the end boundary so today's orders are included
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  to = fmt(tomorrow);

  if (id === "today") {
    from = fmt(now);
  } else if (id === "week") {
    const day = now.getDay() || 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - day + 1);
    from = fmt(mon);
  } else if (id === "month") {
    from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  } else if (id === "year") {
    from = `${now.getFullYear()}-01-01`;
  } else {
    from = "2020-01-01";
  }
  return { from, to };
}

function StatsView({ onBack }) {
  const [period, setPeriod] = useState("week");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodRange(period);
    // build URL manually to avoid any encoding issues
    const url = `orders?select=*&status=eq.served&created_at=gte.${from}&created_at=lte.${to}&order=created_at.asc`;
    sb(url).then((rows) => {
      setOrders(rows || []);
      setLoading(false);
    });
  }, [period]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  // count individual items
  const itemCounts = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const key = it.en;
      if (!itemCounts[key]) itemCounts[key] = { name: it.en, th: it.th, qty: 0, revenue: 0 };
      itemCounts[key].qty += it.qty;
      itemCounts[key].revenue += it.unitPrice * it.qty;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 8);
  const maxQty = topItems[0]?.qty || 1;

  // daily revenue for mini chart
  const dayMap = {};
  orders.forEach((o) => {
    const d = o.created_at ? o.created_at.slice(0, 10) : "?";
    dayMap[d] = (dayMap[d] || 0) + (o.total || 0);
  });
  const days = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
  const maxRev = Math.max(...days.map(([, v]) => v), 1);

  return (
    <div style={{ ...styles.page, background: "#241a10", minHeight: "100vh" }}>
      <style>{globalCss}</style>
      <div style={styles.baristaHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BarChart2 size={20} color="#f3e3c8" />
          <span style={{ color: "#f3e3c8", fontWeight: 800, fontSize: 18 }}>Statistics</span>
        </div>
        <button style={styles.baristaTopBtn} onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, padding: "14px 18px", overflowX: "auto" }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: "0 0 auto",
              background: period === p.id ? "#C8704A" : "#33261A",
              color: period === p.id ? "#fff" : "#cbb89a",
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#cbb89a", padding: 30 }}>Loading…</div>
      ) : (
        <div style={{ padding: "0 18px 40px" }}>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Orders served", value: totalOrders },
              { label: "Total revenue", value: `฿${totalRevenue.toLocaleString()}` },
            ].map((card) => (
              <div key={card.label} style={styles.statCard}>
                <div style={styles.statCardLabel}>{card.label}</div>
                <div style={styles.statCardValue}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Daily revenue bar chart */}
          {days.length > 1 && (
            <div style={{ marginBottom: 26 }}>
              <div style={styles.statsSection}>Revenue by day</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {days.map(([date, rev]) => (
                  <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: "#9a8770" }}>฿{rev}</div>
                    <div
                      style={{
                        width: "100%",
                        background: "#C8704A",
                        borderRadius: "4px 4px 0 0",
                        height: `${Math.max(8, (rev / maxRev) * 54)}px`,
                      }}
                    />
                    <div style={{ fontSize: 9, color: "#6a5a48", whiteSpace: "nowrap" }}>
                      {date.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top items */}
          <div style={styles.statsSection}>Most ordered items</div>
          {topItems.length === 0 && (
            <div style={{ color: "#6a5a48", fontSize: 13 }}>No orders in this period.</div>
          )}
          {topItems.map((it) => (
            <div key={it.name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ color: "#f3e3c8", fontWeight: 700, fontSize: 14 }}>{it.th}</span>
                  <span style={{ color: "#7a6a58", fontSize: 12, marginLeft: 6 }}>{it.name}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "#cbb89a", fontSize: 13 }}>{it.qty}×</span>
                  <span style={{ color: "#C8704A", fontWeight: 700, fontSize: 13 }}>฿{it.revenue}</span>
                </div>
              </div>
              <div style={{ background: "#33261A", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div
                  style={{
                    background: "#C8704A",
                    height: "100%",
                    width: `${(it.qty / maxQty) * 100}%`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ STYLES =============================== */

const globalCss = `
  * { box-sizing: border-box; }
  input::placeholder { color: #c2ad8e; }
  button { font-family: inherit; cursor: pointer; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
`;

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#FBF6EC",
    minHeight: "100%",
    color: "#3c2a18",
    paddingBottom: 90,
  },
  header: {
    background: "linear-gradient(180deg, #1F4E79 0%, #2c628f 100%)",
    padding: "18px 18px 14px",
    borderRadius: "0 0 22px 22px",
    boxShadow: "0 4px 14px rgba(31,78,121,0.25)",
  },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  brandWrap: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "#FBF6EC",
    color: "#1F4E79",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 19,
    fontFamily: "Georgia, serif",
  },
  brandName: { color: "#fff", fontWeight: 800, fontSize: 19, letterSpacing: 0.3, fontFamily: "Georgia, 'Times New Roman', serif" },
  brandTag: { color: "#cfe0ee", fontSize: 11.5, marginTop: 1 },
  staffBtn: {
    background: "rgba(255,255,255,0.14)",
    border: "none",
    borderRadius: 10,
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  langRow: { display: "flex", gap: 6, marginTop: 14, overflowX: "auto", paddingBottom: 2 },
  langChip: {
    flex: "0 0 auto",
    background: "rgba(255,255,255,0.12)",
    color: "#e7eff7",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  langChipActive: { background: "#fff", color: "#1F4E79", border: "1px solid #fff" },
  body: { padding: "20px 18px 40px" },
  categoryTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 21,
    fontWeight: 700,
    color: "#1F4E79",
    marginBottom: 12,
  },
  itemGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  itemCard: {
    background: "#fff",
    border: "1px solid #ECE0CC",
    borderRadius: 14,
    padding: "12px 14px",
    textAlign: "left",
    boxShadow: "0 1px 3px rgba(60,42,24,0.06)",
  },
  itemNameEn: { fontWeight: 700, fontSize: 14.5, color: "#3c2a18" },
  itemNameTh: { fontSize: 12.5, color: "#9a8770", marginTop: 1 },
  itemPrice: { marginTop: 8, fontWeight: 700, color: "#C8704A", fontSize: 14 },
  cartBar: {
    position: "fixed",
    left: 16,
    right: 16,
    bottom: 16,
    background: "#1F4E79",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 8px 24px rgba(31,78,121,0.35)",
    maxWidth: 480,
    margin: "0 auto",
  },
  cartBarBadge: {
    background: "#C8704A",
    borderRadius: 20,
    minWidth: 20,
    height: 20,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(36,26,16,0.5)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 50,
  },
  modalSheet: {
    background: "#fff",
    width: "100%",
    maxWidth: 480,
    borderRadius: "22px 22px 0 0",
    padding: "10px 20px 22px",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  modalHandle: { width: 40, height: 4, background: "#ECE0CC", borderRadius: 4, margin: "4px auto 14px" },
  modalHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: 800, fontFamily: "Georgia, serif", color: "#1F4E79" },
  modalSubtitle: { fontSize: 13.5, color: "#9a8770", marginTop: 2 },
  iconBtn: { background: "#FBF6EC", border: "none", borderRadius: 10, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 12.5, fontWeight: 700, color: "#8a6a4a", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  optionList: { display: "flex", flexDirection: "column", gap: 6 },
  optionRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#FBF6EC",
    border: "1.5px solid #ECE0CC",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#3c2a18",
  },
  optionRowActive: { borderColor: "#1F4E79", background: "#EAF1F7" },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FBF6EC",
    border: "1.5px solid #ECE0CC",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#3c2a18",
    width: "100%",
  },
  toggleRowActive: { borderColor: "#1F4E79", background: "#EAF1F7" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    border: "1.5px solid #C8704A",
    background: "#C8704A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    width: "100%",
    border: "1.5px solid #ECE0CC",
    borderRadius: 10,
    padding: "11px 13px",
    fontSize: 14.5,
    color: "#3c2a18",
    background: "#FBF6EC",
    outline: "none",
  },
  errorText: { color: "#c0392b", fontSize: 12.5, marginTop: 5 },
  modalFooter: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },
  qtyStepper: { display: "flex", alignItems: "center", gap: 8, background: "#FBF6EC", borderRadius: 10, padding: "4px 6px" },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: "none",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  primaryBtn: {
    flex: 1,
    background: "#C8704A",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px 16px",
    fontWeight: 700,
    fontSize: 14.5,
  },
  backLink: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#1F4E79", fontWeight: 700, fontSize: 14, padding: 0, marginBottom: 14 },
  sectionTitle: { fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 800, color: "#1F4E79", marginBottom: 16 },
  emptyState: { color: "#9a8770", textAlign: "center", padding: "40px 10px", fontSize: 14.5 },
  cartRow: { display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #ECE0CC", borderRadius: 14, padding: 12 },
  trashBtn: { background: "none", border: "none", color: "#c0392b", padding: 4 },
  trashBtnDark: { background: "rgba(255,255,255,0.08)", border: "none", color: "#e08a7a", padding: "6px 8px", borderRadius: 8 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1.5px dashed #ECE0CC", color: "#5d4a34", fontWeight: 600 },
  confirmBadge: { width: 64, height: 64, borderRadius: "50%", background: "#3a7d44", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" },

  baristaHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #3a2c1c" },
  baristaTopBtn: { display: "flex", alignItems: "center", gap: 6, background: "#3a2c1c", color: "#f3e3c8", border: "none", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 600 },
  ticketGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, padding: 18 },
  ticket: { background: "#33261A", borderRadius: 16, padding: 16, border: "1px solid #4a3a26" },
  ticketNew: { border: "1.5px solid #C8704A", boxShadow: "0 0 0 3px rgba(200,112,74,0.18)" },
  ticketHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ticketTable: { color: "#f3e3c8", fontWeight: 800, fontSize: 16 },
  ticketTime: { color: "#a08a6c", fontSize: 12, display: "flex", alignItems: "center", gap: 4 },
  ticketItem: { background: "#241a10", borderRadius: 10, padding: "8px 10px" },
  ticketItemTh: { color: "#f3e3c8", fontWeight: 700, fontSize: 15 },
  ticketFooter: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 },
  ticketActionBtn: { background: "#C8704A", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5 },
  ticketStatusTag: { marginLeft: "auto", color: "#a08a6c", fontSize: 12 },
  editRow: { display: "flex", gap: 8, alignItems: "center" },
  editInput: { flex: 1, background: "#33261A", border: "1px solid #4a3a26", borderRadius: 8, padding: "9px 10px", color: "#f3e3c8", fontSize: 13.5 },
  addItemBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed #4a3a26", color: "#cbb89a", borderRadius: 9, padding: "8px 12px", fontSize: 13, marginTop: 8 },
  statCard: { background: "#33261A", borderRadius: 14, padding: "14px 16px" },
  statCardLabel: { color: "#9a8770", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  statCardValue: { color: "#f3e3c8", fontSize: 24, fontWeight: 800 },
  statsSection: { color: "#cbb89a", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, marginTop: 4 },
};
