// scripts/main.js
import { etfList, TIERS, tierMeta } from "./data.js";

console.log("主程式載入成功");
console.log("目前 ETF 數量：", etfList.length);

let etfCardId = 0;

/**
 * 1) 找到卡片列表要放的容器（DOM）
 * 負責「找」，不做渲染
 */
// 去 HTML 裡，把『放卡片的那個盒子』找回來
function getCardContainer() {
  return document.getElementById("etfCardsContainer");
}

/**
 * 2) 建立「一張 ETF 卡片」DOM
 * 負責「做出卡片」，並回傳 card
 */

function createEtfCard(etf) {
  etfCardId += 1;
  const detailId = `etf-card-detail-${etfCardId}`;

  // 建立卡片外殼
  const card = document.createElement("button");
  card.type = "button";
  card.className = "etf-card";
  card.setAttribute("aria-expanded", "false");
  card.setAttribute("aria-controls", detailId);

  // 填入卡片內容
  card.innerHTML = `
    <div class="etf-card__summary">
      <h3 class="etf-card__title">${etf.name}</h3>
      <div class="etf-type-tag">${etf.type}</div>
      <span class="tier-toggle-hint etf-card__toggle-hint" aria-hidden="true">
        <span class="tier-toggle-hint__label">點擊展開</span>
        <span class="tier-toggle-hint__icon">↗</span>
      </span>
    </div>

    <div id="${detailId}" class="etf-card__detail" aria-hidden="true">
      ${
        etf.image
          ? `<div class="etf-card__media">
               <img src="${etf.image}" alt="${etf.name} 角色圖" onerror="this.style.display='none'; console.warn('image failed:', this.src);" />
             </div>`
          : ``
      }

      <p class="etf-card__logic">${etf.selectionLogic}</p>

      <ul class="etf-card__metrics">
        <li>風險指數：<strong>${etf.riskIndex}</strong>/5</li>
        <li>成長指數：<strong>${etf.growthIndex}</strong>/5</li>
        <li>預估配息：<strong>${etf.dividend}</strong></li>
        <li>產業比例：<strong>${etf.industryWeights}</strong></li>
        <li><strong>${etf.description}</strong></li>
      </ul>
    </div>
  `;

  return card;
}

/**
 * 3) 幫卡片加上互動行為（事件）
 * 負責「讓卡片會動」
 */
// （預留之後的 click 行為，這只是 log）加上互動行為
function attachCardEvents(card, etf) {
  const detail = card.querySelector(".etf-card__detail");
  const hintLabel = card.querySelector(".tier-toggle-hint__label");
  const hintIcon = card.querySelector(".tier-toggle-hint__icon");

  function setExpanded(expanded) {
    card.classList.toggle("is-expanded", expanded);
    card.setAttribute("aria-expanded", String(expanded));
    if (detail) {
      detail.setAttribute("aria-hidden", String(!expanded));
    }
    if (hintLabel) {
      hintLabel.textContent = expanded ? "點擊收合" : "點擊展開";
    }
    if (hintIcon) {
      hintIcon.textContent = expanded ? "-" : "↗";
    }
  }

  card.addEventListener("click", () => {
    const expanded = card.classList.contains("is-expanded");
    setExpanded(!expanded);
    console.log("點擊的 ETF：", etf.name);
  });
}

function groupByTier(list) {
  const grouped = {};
  list.forEach((etf) => {
    const key = etf.tier;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(etf);
  });
  return grouped;
}

/**
 * 4) 渲染一整串卡片到畫面上
 * 責任：流程指揮官（找容器 → 清空 → 產卡 → 綁事件 → 放進去）
 */
function renderEtfCardsByWorld(list) {
  const container = getCardContainer();
  if (!container) {
    console.error(
      "找不到 #etfCardsContainer 容器，請確認 index.html 是否有此元素。",
    );
    return;
  }

  container.innerHTML = "";

  const grouped = groupByTier(list);

  TIERS.forEach((tierKey) => {
    const items = grouped[tierKey];
    if (!items || items.length === 0) return;

    // 區塊外框
    const section = document.createElement("section");
    section.className = "world-group";

    // 標題
    const head = document.createElement("div");
    head.className = "world-head";

    const title = document.createElement("h3");
    title.className = "world-title";
    title.textContent = tierMeta[tierKey]?.title ?? tierKey;

    const subtitle = document.createElement("p");
    subtitle.className = "world-subtitle";
    subtitle.textContent = tierMeta[tierKey]?.subtitle ?? "";

    head.appendChild(title);
    head.appendChild(subtitle);
    section.appendChild(head);

    // 卡片 grid
    const grid = document.createElement("div");
    grid.className = "world-grid";

    items.forEach((etf) => {
      const card = createEtfCard(etf);
      attachCardEvents(card, etf);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
// function renderEtfCards(list) {
//   const container = getCardContainer();

//   // 防呆：如果 index.html 不小心改掉 id，這裡會跳錯方便 debug
//   if (!container) {
//     console.error(
//       "找不到 #etfCardsContainer 容器，請確認 index.html 是否有此元素。",
//     );
//     return;
//   }

//   // 渲染前先清空裡面的內容
//   container.innerHTML = "";

//   // 每一筆 ETF 資料建一張卡片
//   list.forEach((etf) => {
//     const card = createEtfCard(etf);
//     attachCardEvents(card, etf);
//     // 把卡片放進容器裡
//     container.appendChild(card);
//   });
// }

// // 5. 在頁面載入時執行一次渲染（放進畫面）
// renderEtfCards(etfList);

/**
 * 6) 初始化：Nav 平滑捲動（只綁 header nav）
 */
function getStickyOffset() {
  const nav = document.querySelector(".nav-wrap");
  const prog = document.querySelector(".progress");
  const navH = nav ? nav.offsetHeight : 0;
  const progH = prog ? prog.offsetHeight : 0;
  return navH + progH;
}

function initSmoothScroll() {
  const links = document.querySelectorAll(".js-scroll"); // 所有 js-scroll 的 class
  if (links.length === 0) return;

  console.log("links 是什麼？", links);
  console.log("links 型別：", Object.prototype.toString.call(links));

  links.forEach((link) => {
    console.log("目前處理的 link：", link);

    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);

      console.log("href:", id, "target:", target);

      if (!target) return;

      e.preventDefault();

      const offset = getStickyOffset();
      const y = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: y, behavior: "smooth" });

      // target.scrollIntoView({ behavior: "smooth", block: "start" });

      // 更新網址列 hash，方便分享/ 返回
      history.pushState(null, "", id);
    });
  });
}

/**
 * 7) 初始化：Scroll Progress Bar
 */
function initScrollProgress() {
  const bar = document.getElementById("progressBar");
  if (!bar) return; // 防呆：沒有進度條就不做

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
}

/**
 * 8) 視差滾動
 */

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // 若使用者偏好減少動態，直接不啟用
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;

  function update() {
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;

    // 只在 hero 還在視窗附近時更新（避免無意義計算）
    if (rect.bottom < 0 || rect.top > vh) return;

    // hero 從「頂端貼齊視窗」開始往上移出視窗：
    // rect.top: 0 -> -rect.height
    const progress = clamp(-rect.top / rect.height, 0, 1);

    const offset = progress * 400;
    hero.style.setProperty("--parallax", `${offset}px`);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

function initMobileMenu() {
  const btn = document.querySelector(".hamburger");
  const panel = document.getElementById("mobileNav");
  if (!btn || !panel) return;

  if (btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";

  const OPEN_CLASS = "is-open";

  function open() {
    panel.hidden = false; // 先讓它出現在 DOM flow
    // 下一幀再加 class，transition 才會生效
    requestAnimationFrame(() => {
      panel.classList.add(OPEN_CLASS);
    });
    btn.setAttribute("aria-expanded", "true");
  }

  function close() {
    panel.classList.remove(OPEN_CLASS);
    btn.setAttribute("aria-expanded", "false");

    // 等動畫結束再 hidden，避免瞬間消失
    const onEnd = (e) => {
      if (e.propertyName !== "opacity") return;
      panel.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  }

  function toggle() {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  }

  btn.addEventListener("click", toggle);

  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) close();
  });
}

function syncStickyOffsetVar() {
  const offset = getStickyOffset();
  document.documentElement.style.setProperty("--sticky-offset", `${offset}px`);
}
window.addEventListener("resize", syncStickyOffsetVar);
syncStickyOffsetVar();

function initCreepyCTA() {
  const btn = document.querySelector(".cta-btn");
  if (!btn) return;

  const eyesContainer = btn.querySelector(".cta-btn__eyes");
  const pupils = btn.querySelectorAll(".cta-btn__pupil");

  if (!eyesContainer || pupils.length === 0) return;

  function updateEyes(e) {
    const rect = eyesContainer.getBoundingClientRect();

    // 眼睛中心點
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 游標位置
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const angle = Math.atan2(dy, dx);

    // 控制移動範圍（越小越保守）
    const radius = 6;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    pupils.forEach((pupil) => {
      pupil.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  function resetEyes() {
    pupils.forEach((pupil) => {
      pupil.style.transform = `translate(0px, 0px)`;
    });
  }

  btn.addEventListener("mousemove", updateEyes);
  btn.addEventListener("touchmove", updateEyes);
  btn.addEventListener("mouseleave", resetEyes);
}

function initWorldCards() {
  const items = Array.from(document.querySelectorAll(".world-item"));
  if (items.length === 0) return;

  function setExpanded(item, expanded) {
    const trigger = item.querySelector(".tier");
    const detail = item.querySelector(".tier-detail");
    if (!trigger || !detail) return;

    item.classList.toggle("is-expanded", expanded);
    trigger.setAttribute("aria-expanded", String(expanded));
    detail.setAttribute("aria-hidden", String(!expanded));
  }

  function collapseOthers(activeItem) {
    items.forEach((item) => {
      if (item !== activeItem) {
        setExpanded(item, false);
      }
    });
  }

  items.forEach((item) => {
    const trigger = item.querySelector(".tier");
    if (!trigger) return;

    const toggle = () => {
      const expanded = item.classList.contains("is-expanded");
      collapseOthers(item);
      setExpanded(item, !expanded);
    };

    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle();
    });
  });
}

function initWorldItemReveal() {
  const items = Array.from(document.querySelectorAll(".world-item"));
  if (items.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  items.forEach((item, index) => {
    item.style.setProperty("--world-item-delay", String(index));
  });

  const reveal = (item) => {
    item.classList.add("is-slide-visible");
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        reveal(item);
        observer.unobserve(item);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  items.forEach((item) => {
    item.classList.add("is-slide-ready");
    observer.observe(item);
  });
}

function initEtfCardReveal() {
  const cards = Array.from(document.querySelectorAll(".etf-card"));
  if (cards.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  cards.forEach((card, index) => {
    card.style.setProperty("--etf-card-delay", String(index));
  });

  const reveal = (card) => {
    card.classList.add("is-slide-visible");
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    cards.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        reveal(card);
        observer.unobserve(card);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  cards.forEach((card) => {
    card.classList.add("is-slide-ready");
    observer.observe(card);
  });
}

function initCategoryListDissolve() {
  const lists = Array.from(document.querySelectorAll(".category-list"));
  if (lists.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  lists.forEach((list) => {
    const items = Array.from(list.querySelectorAll("li"));
    items.forEach((item, index) => {
      item.style.setProperty("--dissolve-index", String(index));
    });
  });

  const reveal = (item) => {
    item.classList.add("is-dissolve-visible");
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    lists.forEach((list) => {
      list.querySelectorAll("li").forEach(reveal);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        reveal(item);
        observer.unobserve(item);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  lists.forEach((list) => {
    list.querySelectorAll("li").forEach((item) => {
      item.classList.add("is-dissolve-ready");
      observer.observe(item);
    });
  });
}

function initCtaButtonReveal() {
  const buttons = Array.from(document.querySelectorAll(".cta-btn"));
  if (buttons.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const reveal = (button) => {
    button.classList.add("is-reveal-visible");
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    buttons.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const button = entry.target;
        reveal(button);
        observer.unobserve(button);
      });
    },
    {
      threshold: 0.25,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  buttons.forEach((button) => {
    button.classList.add("is-reveal-ready");
    observer.observe(button);
  });
}

// ---- 入口：先渲染，再初始化 UI 行為 ----
window.addEventListener("DOMContentLoaded", () => {
  renderEtfCardsByWorld(etfList);
  initSmoothScroll();
  initScrollProgress();
  initHeroParallax();
  initMobileMenu();
  initCreepyCTA();
  initWorldCards();
  initWorldItemReveal();
  initEtfCardReveal();
  initCategoryListDissolve();
  initCtaButtonReveal();
});
