const API =
  document.querySelector("[data-api-base]")?.dataset?.apiBase ||
  "https://search-app-hcwsn.ondigitalocean.app/api";

// CSS asset loaded only once even when two instances exist (desktop + mobile)
let _tbpStyleInjected = false;

function ensureTBPStyles() {
  if (_tbpStyleInjected) return;
  if (document.querySelector('style[data-tbp-search-css="true"]')) {
    _tbpStyleInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.dataset.tbpSearchCss = "true";
  style.textContent = `/* TBP predictive search styles. Loaded once by search-app-v202.js. */
/* ============================
         THEME OVERFLOW FIX
         .t4s-row has overflow:hidden (for the 1000% wide ::before background).
         This clips the absolute dropdown on desktop. Unclip the chain.
      ============================ */

      @media (min-width: 1025px) {
        #shopify-section-header-bottom [data-header-height],
        #shopify-section-header-bottom .t4s-row,
        #shopify-section-header-bottom .t4s-section-header__mid,
        .headermain-search {
          overflow: visible !important;
        }
      }

      /* ============================
         ROOT & CONTAINER
      ============================ */

      #tbp-search-root,
      #tbp-search-root-mobile {
        display: flex !important;
        justify-content: center;
        width: 100%;
        min-height: 44px;
        overflow: visible !important;
        position: relative;
      }

      #tbp-search-root { grid-area: center; }

      .tbp-search-container {
        position: relative;
        width: 100%;
        display: flex !important;
        justify-content: center;
        overflow: visible !important;
      }

      /* ============================
         SEARCH INPUT WRAPPER
      ============================ */
      .tbp-search-input-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tbp-search-input {
  width: 100% !important;
  max-width: 100% !important;
  height: 40px !important;
  padding: 0 45px 0 16px !important;
  border: 1px solid #000 !important;
  font-size: 14px !important;
  background: #EFDDD4 !important;
  line-height: 40px !important;
  color: #111 !important;
  box-sizing: border-box !important;
  outline: none !important;
}

.tbp-search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;   /* pehle 14px tha */
  height: 20px;  /* pehle 14px tha */
  color: #8a8a8a;
  pointer-events: none;
  z-index: 2;
}

.tbp-search-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

      /* ============================
         INPUT
      ============================ */

      .tbp-search-input:focus {
        border-color: #c49a7a !important;
        box-shadow: 0 0 0 3px rgba(196,154,122,0.15) !important;
      }

      .tbp-search-input::placeholder {
        color: #b08060 !important;
        font-size: 13px !important;
      }

      /* ============================
         DROPDOWN — DESKTOP
      ============================ */

      .tbp-wrapper {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        width: min(860px, 96vw);
        background: #fff;
        border-radius: 0;
        padding: 28px 28px 20px;
        overflow: visible;
        box-shadow: 0 24px 64px rgba(0,0,0,0.11), 0 4px 16px rgba(0,0,0,0.06);
        z-index: 99999;
      }

      .tbp-hidden { display: none !important; }

      /* Slide-in animation */
      .tbp-wrapper:not(.tbp-hidden) {
        animation: tbpSlideDown 0.18s ease;
      }

      .tbp-wrapper.tbp-closing {
        pointer-events: none;
        animation: tbpSlideUp 0.16s ease forwards;
      }

      @keyframes tbpSlideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      @keyframes tbpSlideUp {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
      }

      /* ============================
         LAYOUT — DESKTOP (2 col)
      ============================ */

      .tbp-layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 0;
        width: 100%;
        align-items: start;
      }

      .tbp-left {
        padding-right: 24px;
        border-right: 1px solid #f0f0f0;
      }

      .tbp-right {
        padding-left: 24px;
      }

      .tbp-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2.5px;
    color: #534f4f;
    margin-bottom: 12px;
    text-transform: uppercase;
    text-align: start;
}

      .tbp-bottom-label {
        margin-top: 24px;
      }

      .tbp-empty-brand {
        color: #999;
        cursor: default;
      }

      /* ============================
         BRANDS
      ============================ */

      .tbp-brands > div {
    margin: 6px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 13.5px;
    color: #333;
    font-weight: 400;
    padding: 0px 0;
    border-bottom: 1px solid transparent;
    transition: color 0.15s ease;
}

      .tbp-brands > div:hover { color: #000; }

      .tbp-brands > div::after {
        content: "↗";
        color: #ccc;
        font-size: 12px;
        transition: color 0.15s ease;
      }

      .tbp-brands > div:hover::after { color: #888; }

      /* ============================
         COLLECTIONS
      ============================ */

      .tbp-collections {
    display: flex;
    flex-wrap: wrap;
    gap: 11px;
    margin: 8px 0 24px;
}

      .tbp-collections span {
        display: inline-flex;
        align-items: center;
        padding: 5px 12px;
        border-radius: 30px;
        background: #f6f4f2;
        border: 1px solid #ebe8e4;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.2px;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        color: #666;
        line-height: 1.25;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
        text-align: left;
      }

      .tbp-collections span::before {
        content: "#";
        margin-right: 3px;
        color: #aaa;
      }

      .tbp-collections span:hover {
        background: #111;
        color: #fff;
        border-color: #111;
      }

      .tbp-collections span:hover::before { color: #aaa; }

      /* ============================
         PRODUCTS — DESKTOP (3 col)
      ============================ */

      .tbp-products {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .tbp-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

      .tbp-card:hover { transform: translateY(-2px); }

      .tbp-card img {
        width: 100%;
        aspect-ratio: 3 / 5;
        object-fit: cover;
        object-position: top center;
        border-radius: 10px;
        background: #f4f4f4;
        transition: border-radius 0.15s ease;
      }

      .tbp-card:hover img { border-radius: 12px; }

      .tbp-card h4 {
  text-align: left;
  margin: 8px 0 0;
  line-height: 1.4;
  min-height: 24px; /* exactly 2 lines */
  max-height: 24px;
  font-size:16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}


      .tbp-vendor {
  margin-top: auto;
  font-size: 13px;
  text-align: left;
  width: 100%;
}

.tbp-card p {
  margin-top: 5px;
  text-align: left;
  width: 100%;
}

.tbp-card .tbp-price,
.tbp-card .tbp-whatsapp-btn {
  text-align: left;
}

      /* ============================
         VIEW ALL
      ============================ */

      .tbp-view-all {
        grid-column: 1 / -1;
        text-align: center;
        padding: 14px 12px 4px;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        color: #888;
        border-top: 1px solid #f0f0f0;
        margin-top: 4px;
        letter-spacing: 0.3px;
        transition: color 0.15s ease;
      }

      .tbp-view-all:hover { color: #111; }

      .tbp-mobile-view-more {
        display: none;
      }

      /* ============================
         TABLET  769px – 1280px
      ============================ */

      @media (max-width: 1280px) {
        .tbp-layout { grid-template-columns: 210px 1fr; }
      }

      @media (max-width: 1024px) {
        .tbp-wrapper {
          width: min(860px, 96vw);
          padding: 22px 20px 16px;
        }
        .tbp-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .tbp-left {
          display: flex;
          flex-direction: column;
          order: 1;
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #f0f0f0;
          padding-right: 0;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }
        .tbp-right {
          order: 2;
          padding-left: 0;
          width: 100%;
        }
        .tbp-bottom-label { order: 1; }
        .tbp-cat-buttons { order: 0; }
        .tbp-collections { order: 2; }
        .tbp-left-label { order: 3; margin-top: 18px; }
        .tbp-brands { order: 4; }
        .tbp-brands,
        .tbp-collections {
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          gap: 0;
        }
        .tbp-brands > div {
          width: 100%;
          margin: 0;
          padding: 9px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .tbp-collections span {
          width: 100%;
          justify-content: flex-start;
          border-radius: 0;
          padding: 9px 0;
          background: #fff;
          border-width: 0 0 1px;
        }
        .tbp-products { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .tbp-card img { aspect-ratio: 3 / 5; }
      }

      /* ============================
         SMALL TABLET  541px – 768px
      ============================ */

      /* ============================
         TABLET  541px – 768px
      ============================ */

      @media (max-width: 768px) {
        .tbp-wrapper {
          width: 96vw;
          padding: 20px 16px 14px;
          border-radius: 0;
        }

        /* Switch to flex column so order is guaranteed */
        .tbp-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* 1st: Brands + Collections */
        .tbp-left {
          display: flex;
          flex-direction: column;
          order: 1;
          border-right: none;
          border-bottom: 1px solid #f0f0f0;
          padding-right: 0;
          padding-bottom: 14px;
          margin-bottom: 14px;
          width: 100%;
        }

        /* 2nd: Products + View More */
        .tbp-right {
          order: 2;
          padding-left: 0;
          width: 100%;
        }

        .tbp-products {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 10px;
        }

        .tbp-brands {
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          gap: 0;
        }

        .tbp-brands > div {
          padding: 9px 0;
          background: #fff;
          border: none;
          border-bottom: 1px solid #f0f0f0;
          border-radius: 0;
          font-size: 12px;
          margin: 0;
        }

        .tbp-brands > div::after { display: inline-flex; }
      }

      /* /* // call for pricing and whatsapp order on mobile */
.tbp-whatsapp-btn{
  display:flex;
  align-items:center;
  gap:5px;
  margin-top:5px;
  font-size:10.5px;
  font-weight:500;
  color:#25D366;
  text-decoration:none;
}

.tbp-whatsapp-btn svg{
  width:18px;
  height:18px;
  flex-shrink:0;
}

.tbp-whatsapp-btn:hover{
  opacity:.8;
}

/* Tags Buttons CSS */
/* ============================
   CATEGORY FILTER BUTTONS
============================ */

.tbp-cat-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.tbp-cat-btn {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    /* border-radius: 30px; */
    border: 1px solid #d0c8c0;
    background: #9C8B67;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.3s ease;
    font-family: inherit;
}

button.tbp-cat-btn:hover{
    background: #FAF8F4;
    color: #9C8B67;
    border-color: #9C8B67;    
}

.tbp-cat-btn:active {
  transform: translateY(0);
}

@media (max-width: 540px) {
  .tbp-cat-buttons {
    gap: 5px;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
  .tbp-cat-btn {
    font-size: 11px;
    padding: 5px 11px;
  }
}

      /* ============================
         MOBILE  < 540px
      ============================ */

      @media (max-width: 768px) {
        .tbp-wrapper {
          max-height: 78vh;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #e5e5e5 transparent;
        }
        .tbp-wrapper::-webkit-scrollbar { width: 4px; }
        .tbp-wrapper::-webkit-scrollbar-track { background: transparent; }
        .tbp-wrapper::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
      }

      @media (max-width: 540px) {
        .tbp-wrapper {
          position: absolute !important;
          top: calc(80% + 8px) !important;
          left: 50% !important;
          right: auto !important;
          bottom: auto !important;
          transform: translateX(-50%) !important;
          width: 100% !important;
          max-width: 100% !important;
          /* // border-radius: 0 !important; */
          padding: 16px 14px 14px !important;
          max-height: 75vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12) !important;
        }

        .tbp-wrapper::before { display: none !important; }

        /* Flex column — guaranteed order */
        .tbp-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* 1st: Brands + Collections */
        .tbp-left {
          order: 1;
          border-right: none;
          border-bottom: 1px solid #f0f0f0;
          padding-right: 0;
          padding-bottom: 14px;
          margin-bottom: 14px;
          width: 100%;
        }

        /* 2nd: Products + View More */
        .tbp-right {
          order: 2;
          padding-left: 0;
          width: 100%;
        }

        .tbp-products {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

            .tbp-card img {
        aspect-ratio: 3 / 5;
        object-position: top center;
        border-radius: 10px;
    }
        .tbp-card h4    { font-size: 11.5px; min-height: 0; }
        .tbp-card p     { font-size: 12px; }
        .tbp-view-all   { font-size: 12px; padding: 12px 0 2px; }
        .tbp-label      { font-size: 10px; margin-bottom: 10px; }

        .tbp-search-input {
    height: 40px !important;
    line-height: 40px !important;
    font-size: 14px !important;
  }

        .tbp-brands {
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          gap: 0;
        }

            .tbp-brands > div {
        width: 100%;
        padding: 9px 0;
        background: #ffffff;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        border-radius: 0px;
        font-size: 13px;
        margin: 0;
    }
        .tbp-brands > div::after {
    content: "↗";
    color: #ccc;
    font-size: 13px;
    transition: color 0.15s ease;
}

        .tbp-brands > div::after { display: inline-flex; }

        .tbp-bottom-label { order: 1; }
        .tbp-cat-buttons { order: 0; }
        .tbp-collections { order: 2; }
        .tbp-left-label { order: 3; margin-top: 18px; }
        .tbp-brands { order: 4; }

        .tbp-collections {
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          gap: 0;
        }

        .tbp-collections span {
          width: 100%;
          border-radius: 0;
          padding: 9px 0;
          background: #fff;
          border-width: 0 0 1px;
        }

      }

      /* ============================
         VERY SMALL  < 375px
      ============================ */

      @media (max-width: 375px) {
        .tbp-wrapper  { width: 96vw !important; padding: 14px 12px 12px !important; }
        .tbp-products { gap: 8px; }
        .tbp-card h4  { font-size: 11px; }
        .tbp-card p   { font-size: 11.5px; }
        .tbp-collections span { font-size: 12px; padding: 5px 10px; }
      }

      /* Final mobile layout override */
      @media (max-width: 768px) {
        .tbp-wrapper {
          width: 100vw !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          box-sizing: border-box !important;
          border-radius: 0 !important;
        }

        .tbp-layout {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
        }

        .tbp-left {
          display: flex !important;
          flex-direction: column !important;
          order: 1 !important;
          width: 100% !important;
          border-right: 0 !important;
          border-bottom: 1px solid #f0f0f0 !important;
          padding-right: 0 !important;
          padding-bottom: 14px !important;
          margin-bottom: 14px !important;
        }

        .tbp-right {
          order: 2 !important;
          width: 100% !important;
          padding-left: 0 !important;
        }

        .tbp-cat-buttons {
          order: 0 !important;
          justify-content: center !important;
          width: 100% !important;
          margin: 0 0 7px !important;
          padding: 0 0 7px !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }

        .tbp-bottom-label {
          order: 1 !important;
          margin-top: 10px !important;
        }

        .tbp-collections {
          order: 2 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          margin-top: 4px !important;
          width: 100% !important;
        }

        .tbp-collections span {
    display: inline-flex;
    align-items: center;
    padding: 5px 0px;
    border-radius: 30px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    color: #666;
    line-height: 1.25;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    text-align: left;
}

        .tbp-left-label {
          order: 3 !important;
          margin-top: 18px !important;
        }

        .tbp-brands {
          order: 4 !important;
          display: block !important;
          flex-wrap: wrap !important;
          gap: 6px !important;
          width: 100% !important;
        }

        .tbp-brands > div {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 9px 0 !important;
          margin: 0 !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          color: #333 !important;
        }

        .tbp-brands > div::after {
          content: "↗" !important;
          display: inline-flex !important;
          flex: 0 0 auto !important;
          margin-left: 12px !important;
          color: #bbb !important;
          font-size: 13px !important;
        }

        .tbp-products {
          width: 100% !important;
        }

        .tbp-card img {
          aspect-ratio: 3 / 5 !important;
          object-position: top center !important;
          border-radius: 10px !important;
        }
      }

      @media (max-width: 480px) {
        .tbp-wrapper {
          padding: 16px 14px 14px !important;
          max-height: calc(100vh - 52px) !important;
        }

        .tbp-products {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        .tbp-cat-buttons {
          gap: 5px !important;
          margin-bottom: 6px !important;
          padding-bottom: 6px !important;
        }

        .tbp-cat-btn {
          font-size: 11px !important;
          padding: 4px 8px !important;
        }

        .tbp-collections span {
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .tbp-card h4 {
          font-size: 13px !important;
          line-height: 1.35 !important;
        }
      }

      @media (max-width: 380px) {
        .tbp-wrapper {
          padding: 14px 12px 12px !important;
        }

        .tbp-products {
          gap: 8px !important;
        }

        .tbp-cat-btn {
          font-size: 10.5px !important;
          padding: 4px 7px !important;
        }

        .tbp-collections span,
        .tbp-brands > div {
          font-size: 11px !important;
        }

        .tbp-card h4 {
          font-size: 11px !important;
        }
      }

      @media (min-width: 481px) and (max-width: 676px) {
        .tbp-wrapper {
          padding: 18px 16px 16px !important;
          max-height: calc(100vh - 56px) !important;
        }

        .tbp-products {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 12px !important;
        }

        .tbp-cat-buttons {
          gap: 6px !important;
          margin-bottom: 7px !important;
          padding-bottom: 7px !important;
        }

        .tbp-cat-btn {
          font-size: 11.5px !important;
          padding: 4px 9px !important;
        }
      }

      @media (min-width: 677px) and (max-width: 768px) {
        .tbp-wrapper {
          padding: 20px 18px 16px !important;
          max-height: calc(100vh - 60px) !important;
        }

        .tbp-products {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 14px !important;
        }
      }

/* Final overrides */
#tbp-search-root p,
      #tbp-search-root-mobile p { margin-bottom: 0 !important; }

      #tbp-search-root .tbp-wrapper,
      #tbp-search-root-mobile .tbp-wrapper {
        position: absolute !important;
        top: calc(100% + 8px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: min(860px, 96vw) !important;
        background: #fff !important;
        border-radius: 0 !important;
        padding: 28px 28px 28px !important;
        overflow: visible !important;
        box-shadow: 0 24px 64px rgba(0,0,0,.11), 0 4px 16px rgba(0,0,0,.06) !important;
        z-index: 99999 !important;
      }

      #tbp-search-root.tbp-has-query .tbp-wrapper,
      #tbp-search-root-mobile.tbp-has-query .tbp-wrapper { padding-bottom: 0 !important; }

      #tbp-search-root .tbp-collections span,
      #tbp-search-root-mobile .tbp-collections span {
        display: inline-flex !important;
        align-items: center !important;
        padding: 5px 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        border: 0 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        letter-spacing: .2px !important;
        color: #666 !important;
        line-height: 1.5 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        text-align: left !important;
      }

      #tbp-search-root .tbp-collections span:hover,
      #tbp-search-root-mobile .tbp-collections span:hover {
        background: transparent !important;
        color: #222 !important;
        border-color: transparent !important;
      }

      #tbp-search-root .tbp-card img,
      #tbp-search-root-mobile .tbp-card img {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        aspect-ratio: 4 / 5 !important;
        object-fit: cover !important;
        object-position: top center !important;
        border-radius: 10px !important;
        background: #f4f4f4 !important;
        transition: border-radius .15s ease !important;
      }

      #tbp-search-root .tbp-card h4,
      #tbp-search-root-mobile .tbp-card h4 {
            display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    min-height: 45px !important;
    max-height: 34px !important;
    margin: 8px 0 0 !important;
    line-height: 1.25 !important;
    overflow: hidden !important;
    text-align: left !important;
}

      #tbp-search-root .tbp-vendor,
      #tbp-search-root-mobile .tbp-vendor {
        margin-top: 4px !important;
        min-height: 14px !important;
        line-height: 1.25 !important;
        font-size: 13px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #tbp-search-root .tbp-card p,
      #tbp-search-root-mobile .tbp-card p,
      #tbp-search-root .tbp-price,
      #tbp-search-root-mobile .tbp-price {
        margin-top: 4px !important;
        line-height: 1.25 !important;
      }

      @media (min-width: 769px) {
        #tbp-search-root .tbp-wrapper,
        #tbp-search-root-mobile .tbp-wrapper {
          width: min(900px, 96vw) !important;
          max-height: calc(100vh - 96px) !important;
          padding: 24px 24px 18px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }

        #tbp-search-root .tbp-layout,
        #tbp-search-root-mobile .tbp-layout {
          display: grid !important;
          grid-template-columns: 220px minmax(0, 1fr) !important;
          gap: 0 !important;
          align-items: stretch !important;
        }

        #tbp-search-root .tbp-left,
        #tbp-search-root-mobile .tbp-left {
          min-width: 0 !important;
          padding-right: 22px !important;
          border-right: 1px solid #f0f0f0 !important;
        }

        #tbp-search-root .tbp-right,
        #tbp-search-root-mobile .tbp-right {
          min-width: 0 !important;
          padding-left: 22px !important;
          display: flex !important;
          flex-direction: column !important;
        }

        #tbp-search-root .tbp-products,
        #tbp-search-root-mobile .tbp-products {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 14px !important;
          align-content: start !important;
                  margin-top: 15px;
        }

        #tbp-search-root .tbp-card,
        #tbp-search-root-mobile .tbp-card {
          min-width: 0 !important;
          height: auto !important;
        }

        #tbp-search-root .tbp-card img,
        #tbp-search-root-mobile .tbp-card img {
          aspect-ratio: 3 / 4 !important;
          object-fit: cover !important;
          object-position: top center !important;
        }

        #tbp-search-root .tbp-view-all,
        #tbp-search-root-mobile .tbp-view-all {
          align-self: stretch !important;
          margin-top: 2px !important;
        }
      }

      #tbp-search-root .tbp-view-all,
      #tbp-search-root-mobile .tbp-view-all {
        grid-column: 1 / -1 !important;
        text-align: center !important;
        padding: 3px 12px 3px !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        color: #000 !important;
        border-top: 1px solid #f0f0f0 !important;
        margin-top: 2px !important;
        letter-spacing: .3px !important;
        transition: color .15s ease !important;
      }

      #tbp-search-root.tbp-has-query .tbp-card img,
      #tbp-search-root-mobile.tbp-has-query .tbp-card img {
        aspect-ratio: 5 / 6 !important;
      }

      #tbp-search-root.tbp-has-query .tbp-card h4,
      #tbp-search-root-mobile.tbp-has-query .tbp-card h4 {
        min-height: 30px !important;
        max-height: 30px !important;
        margin-top: 5px !important;
        line-height: 1.2 !important;
      }

      #tbp-search-root.tbp-has-query .tbp-products,
      #tbp-search-root-mobile.tbp-has-query .tbp-products {
        gap: 10px !important;
      }

      #tbp-search-root .tbp-typo-suggestions .tbp-typo-item,
      #tbp-search-root-mobile .tbp-typo-suggestions .tbp-typo-item {
        display: block !important;
    width: auto !important;
    max-width: 100% !important;
    padding: 8px 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    border: 0 !important;
    color: #4d4d4d !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    letter-spacing: .2px !important;
    line-height: 1.25 !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    text-align: left !important;
    cursor: pointer !important;
}
      }

      #tbp-search-root .tbp-typo-hash,
      #tbp-search-root-mobile .tbp-typo-hash {
        margin-right: 3px !important;
        color: #aaa !important;
      }

      @media (max-width: 768px) {
        #tbp-search-root .tbp-wrapper,
        #tbp-search-root-mobile .tbp-wrapper {
          width: 100vw !important;
          max-width: 100vw !important;
          top: 100% !important;
          padding: 18px 16px 18px !important;
        }
        #tbp-search-root.tbp-has-query .tbp-wrapper,
        #tbp-search-root-mobile.tbp-has-query .tbp-wrapper { padding-bottom: 0 !important; }

        #tbp-search-root .tbp-left,
        #tbp-search-root-mobile .tbp-left {
          order: 2 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        #tbp-search-root .tbp-right,
        #tbp-search-root-mobile .tbp-right {
          order: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        #tbp-search-root .tbp-left-label,
        #tbp-search-root-mobile .tbp-left-label {
          order: 1 !important;
          margin-top: 0 !important;
        }

        #tbp-search-root .tbp-brands,
        #tbp-search-root-mobile .tbp-brands {
          order: 2 !important;
        }

        #tbp-search-root .tbp-bottom-label,
        #tbp-search-root-mobile .tbp-bottom-label {
          order: 3 !important;
          margin-top: 18px !important;
        }

        #tbp-search-root .tbp-collections,
        #tbp-search-root-mobile .tbp-collections {
          order: 4 !important;
        }

        #tbp-search-root .tbp-typo-label,
        #tbp-search-root-mobile .tbp-typo-label {
          order: 5 !important;
          margin-top: 18px !important;
        }

        #tbp-search-root .tbp-typo-suggestions,
        #tbp-search-root-mobile .tbp-typo-suggestions {
          order: 6 !important;
        }

        #tbp-search-root .tbp-products > .tbp-view-all,
        #tbp-search-root-mobile .tbp-products > .tbp-view-all {
          display: none !important;
        }

        #tbp-search-root .tbp-mobile-view-more,
        #tbp-search-root-mobile .tbp-mobile-view-more {
          display: block;
          order: 3 !important;
          width: 100% !important;
          text-align: center !important;
        }

        #tbp-search-root .tbp-mobile-view-more .tbp-view-all,
        #tbp-search-root-mobile .tbp-mobile-view-more .tbp-view-all {
          display: block !important;
          width: 100% !important;
          padding: 10px 0 10px !important;
        }
      }

      /* Final left column rhythm */
      #tbp-search-root .tbp-left,
      #tbp-search-root-mobile .tbp-left {
        --tbp-left-section-gap: 14px;
      }

      #tbp-search-root .tbp-left .tbp-label,
      #tbp-search-root-mobile .tbp-left .tbp-label {
        margin: var(--tbp-left-section-gap) 0 8px !important;
        line-height: 1.2 !important;
      }

      #tbp-search-root .tbp-left .tbp-label:first-child,
      #tbp-search-root-mobile .tbp-left .tbp-label:first-child {
        margin-top: 20px !important;
      }

      #tbp-search-root .tbp-brands,
      #tbp-search-root-mobile .tbp-brands,
      #tbp-search-root .tbp-collections,
      #tbp-search-root-mobile .tbp-collections,
      #tbp-search-root .tbp-typo-suggestions,
      #tbp-search-root-mobile .tbp-typo-suggestions {
        margin: 0 !important;
      }

      #tbp-search-root .tbp-collections,
      #tbp-search-root-mobile .tbp-collections,
      #tbp-search-root .tbp-typo-suggestions,
      #tbp-search-root-mobile .tbp-typo-suggestions {
        display: flex !important;
        flex-direction: column !important;
        gap: 5px !important;
      }

      #tbp-search-root.tbp-has-query .tbp-collections,
      #tbp-search-root-mobile.tbp-has-query .tbp-collections,
      #tbp-search-root.tbp-has-query .tbp-typo-suggestions,
      #tbp-search-root-mobile.tbp-has-query .tbp-typo-suggestions {
        min-height: 0 !important;
      }

      #tbp-search-root .tbp-typo-suggestions.tbp-loading,
      #tbp-search-root-mobile .tbp-typo-suggestions.tbp-loading {
        opacity: 0 !important;
        pointer-events: none !important;
      }

      #tbp-search-root.tbp-has-query .tbp-typo-suggestions:not(.tbp-loading),
      #tbp-search-root-mobile.tbp-has-query .tbp-typo-suggestions:not(.tbp-loading) {
        min-height: 0 !important;
      }

      #tbp-search-root .tbp-collections span,
      #tbp-search-root-mobile .tbp-collections span,
      #tbp-search-root .tbp-typo-suggestions .tbp-typo-item,
      #tbp-search-root-mobile .tbp-typo-suggestions .tbp-typo-item {
        padding: 4px 0 !important;
        line-height: 1.3 !important;
      }

      #tbp-search-root .tbp-collection-item,
      #tbp-search-root-mobile .tbp-collection-item,
      #tbp-search-root .tbp-typo-suggestions .tbp-typo-item,
      #tbp-search-root-mobile .tbp-typo-suggestions .tbp-typo-item {
        display: grid !important;
        grid-template-columns: 11px minmax(0, 1fr) !important;
        column-gap: 4px !important;
        align-items: start !important;
        width: 100% !important;
        max-width: 100% !important;
        text-align: left !important;
      }

      #tbp-search-root .tbp-item-hash,
      #tbp-search-root-mobile .tbp-item-hash {
        grid-column: 1 !important;
        display: block !important;
        width: 11px !important;
        margin: 0 !important;
        color: #aaa !important;
        line-height: 1.3 !important;
        text-align: left !important;
      }

      #tbp-search-root .tbp-collection-item::before,
      #tbp-search-root-mobile .tbp-collection-item::before,
      #tbp-search-root .tbp-collections span::before,
      #tbp-search-root-mobile .tbp-collections span::before {
        content: none !important;
        display: none !important;
      }

      #tbp-search-root .tbp-item-text,
      #tbp-search-root-mobile .tbp-item-text {
        grid-column: 2 !important;
        display: block !important;
        min-width: 0 !important;
        max-width: 100% !important;
        line-height: 1.3 !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        text-align: left !important;
      }

      #tbp-search-root .tbp-card:hover,
      #tbp-search-root-mobile .tbp-card:hover {
        transform: none !important;
      }

      #tbp-search-root .tbp-card:hover img,
      #tbp-search-root-mobile .tbp-card:hover img {
        border-radius: 10px !important;
      }

      #tbp-search-root .tbp-collections,
      #tbp-search-root-mobile .tbp-collections,
      #tbp-search-root .tbp-typo-suggestions,
      #tbp-search-root-mobile .tbp-typo-suggestions {
        display: block !important;
        gap: 0 !important;
        margin: 0 0 0 !important;
      }

      #tbp-search-root .tbp-collections span,
      #tbp-search-root-mobile .tbp-collections span,
      #tbp-search-root .tbp-typo-suggestions .tbp-typo-item,
      #tbp-search-root-mobile .tbp-typo-suggestions .tbp-typo-item {
        margin: 2px 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: pointer !important;
        font-size: 13.5px !important;
        color: #333 !important;
        font-weight: 400 !important;
        padding: 0 !important;
        border-bottom: 1px solid transparent !important;
        background: transparent !important;
        border-radius: 0 !important;
        transition: color 0.15s ease !important;
        line-height: 1.4 !important;
      }

      #tbp-search-root .tbp-brands > div,
      #tbp-search-root-mobile .tbp-brands > div {
        margin: 5px 0 !important;
        padding: 0 !important;
        line-height: 1.4 !important;
      }

      #tbp-search-root .tbp-item-hash,
      #tbp-search-root-mobile .tbp-item-hash {
        display: inline !important;
        width: auto !important;
        margin-right: 3px !important;
        line-height: 1.4 !important;
      }

      #tbp-search-root .tbp-item-text,
      #tbp-search-root-mobile .tbp-item-text {
        display: inline !important;
        flex: 1 1 auto !important;
        line-height: 1.4 !important;
      }

      #tbp-search-root .tbp-collections.tbp-hidden,
      #tbp-search-root-mobile .tbp-collections.tbp-hidden,
      #tbp-search-root .tbp-typo-suggestions.tbp-hidden,
      #tbp-search-root-mobile .tbp-typo-suggestions.tbp-hidden,
      #tbp-search-root .tbp-mobile-view-more.tbp-hidden,
      #tbp-search-root-mobile .tbp-mobile-view-more.tbp-hidden {
        display: none !important;
      }

      @media (max-width: 768px) {
        #tbp-search-root .tbp-label,
        #tbp-search-root-mobile .tbp-label {
          margin: 0px 0 10px !important;
        }
      }

      @media (min-width: 769px) {
        #tbp-search-root .tbp-left,
        #tbp-search-root-mobile .tbp-left {
          max-height: none !important;
          overflow: visible !important;
          padding-bottom: 2px !important;
        }
      }

      /* Final no-slider + product text rhythm */
      #tbp-search-root .tbp-wrapper,
      #tbp-search-root-mobile .tbp-wrapper,
      #tbp-search-root .tbp-left,
      #tbp-search-root-mobile .tbp-left {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      #tbp-search-root .tbp-wrapper::-webkit-scrollbar,
      #tbp-search-root-mobile .tbp-wrapper::-webkit-scrollbar,
      #tbp-search-root .tbp-left::-webkit-scrollbar,
      #tbp-search-root-mobile .tbp-left::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }

      #tbp-search-root .tbp-wrapper,
      #tbp-search-root-mobile .tbp-wrapper {
        overflow-x: hidden !important;
      }

      @media (min-width: 769px) {
        #tbp-search-root .tbp-wrapper,
        #tbp-search-root-mobile .tbp-wrapper {
          overflow-y: auto !important;
          scrollbar-width: auto !important;
          -ms-overflow-style: auto !important;
        }

        #tbp-search-root .tbp-wrapper::-webkit-scrollbar,
        #tbp-search-root-mobile .tbp-wrapper::-webkit-scrollbar {
          display: block !important;
          width: 6px !important;
          height: 6px !important;
        }

        #tbp-search-root .tbp-wrapper::-webkit-scrollbar-track,
        #tbp-search-root-mobile .tbp-wrapper::-webkit-scrollbar-track {
          background: transparent !important;
        }

        #tbp-search-root .tbp-wrapper::-webkit-scrollbar-thumb,
        #tbp-search-root-mobile .tbp-wrapper::-webkit-scrollbar-thumb {
          background: #dedede !important;
          border-radius: 8px !important;
        }
      }

      #tbp-search-root .tbp-view-all,
      #tbp-search-root-mobile .tbp-view-all {
        display: block !important;
        width: fit-content !important;
        min-width: 160px !important;
        max-width: 100% !important;
        margin: 20px auto !important;
        padding: 8px 12px !important;
        text-align: center !important;
      }

      #tbp-search-root .tbp-card,
      #tbp-search-root-mobile .tbp-card {
        display: flex !important;
        flex-direction: column !important;
        min-width: 0 !important;
      }

      #tbp-search-root .tbp-card h4,
      #tbp-search-root-mobile .tbp-card h4 {
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        min-height: 36px !important;
        max-height: 36px !important;
        margin: 8px 0 0 !important;
        line-height: 18px !important;
        overflow: hidden !important;
        text-align: left !important;
      }

      #tbp-search-root .tbp-vendor,
      #tbp-search-root-mobile .tbp-vendor {
        display: block !important;
        min-height: 16px !important;
        max-height: 16px !important;
        margin: 5px 0 0 !important;
        line-height: 16px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #tbp-search-root .tbp-vendor-empty,
      #tbp-search-root-mobile .tbp-vendor-empty {
        visibility: hidden !important;
      }

      #tbp-search-root .tbp-card .tbp-price,
      #tbp-search-root-mobile .tbp-card .tbp-price {
        display: block !important;
        min-height: 16px !important;
        margin: 5px 0 0 !important;
        line-height: 16px !important;
      }

      #tbp-search-root .tbp-whatsapp-btn,
      #tbp-search-root-mobile .tbp-whatsapp-btn {
        min-height: 20px !important;
        margin-top: 5px !important;
      }

/* WhatsApp button styles */
#tbp-search-root .tbp-whatsapp-btn,
  #tbp-search-root-mobile .tbp-whatsapp-btn {
    font-size: 10.5px !important;
    line-height: 1.2 !important;
    gap: 5px !important;
  }

  #tbp-search-root .tbp-whatsapp-btn svg,
  #tbp-search-root-mobile .tbp-whatsapp-btn svg {
    width: 18px !important;
    height: 18px !important;
    flex: 0 0 18px !important;
  }`;
  document.head.appendChild(style);
  _tbpStyleInjected = true;
}


// ============================
// INIT ALL ROOTS
// ============================

function initAllTBPRoots() {
  const roots = [
    document.getElementById("tbp-search-root"),
    document.getElementById("tbp-search-root-mobile"),
  ];
  roots.forEach(r => { if (r) initTBPSearch(r); });
}

// ============================
// SINGLE INSTANCE INIT
// ============================

function initTBPSearch(root) {
  if (!root || root.dataset.loaded) return;
  root.dataset.loaded = "true";

  const shop =
    window.Shopify?.shop ||
    root.dataset.shop ||
    location.hostname;

  let isSearching = false;
  let searchTimeout;
  let typoSuggestionTimeout;
  let currentController = null;
  let typoSuggestionController = null;
  let displayConfig = { showTrendingCollections: true, showSuggestions: false };
  let trendingCache = null;
  let trendingPromise = null;
  const searchResultCache = {};
  let renderGen = 0; // increments every time user types — invalidates stale loadTrending renders

  // ======================
  // HTML (class-based, not IDs — safe for multiple instances)
  // ======================

  root.innerHTML = `
    <div class="tbp-search-container">

    <!-- input wrapper with input field and search icon -->

      <div class="tbp-search-input-wrapper">

      <input
        class="tbp-search-input"
        placeholder=""
      />
<span class="tbp-search-icon">
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="20" y1="20" x2="16.5" y2="16.5"></line>
  </svg>
</span>
    </div>

      <div class="tbp-wrapper tbp-hidden">

        <div class="tbp-layout">

          <div class="tbp-left">
            <p class="tbp-label tbp-left-label tbp-hidden">TRENDING BRANDS</p>
            <div class="tbp-brands"></div>
            <p class="tbp-label tbp-bottom-label tbp-hidden">COLLECTIONS</p>
            <div class="tbp-collections"></div>
            <p class="tbp-label tbp-typo-label tbp-hidden">SUGGESTIONS</p>
            <div class="tbp-typo-suggestions tbp-hidden"></div>
          </div>

          <div class="tbp-right">
            <p class="tbp-label tbp-right-label tbp-hidden">TRENDING NOW</p>
            <div class="tbp-products"></div>
          </div>

          <div class="tbp-mobile-view-more tbp-hidden"></div>

        </div>

      </div>

    </div>
  `;

  // ======================
  // STYLES
  // ======================

  ensureTBPStyles();

  // ======================
  // SCOPED HELPERS
  // ======================

  const input = root.querySelector(".tbp-search-input");
  const wrapper = root.querySelector(".tbp-wrapper");

  function q(sel) { return root.querySelector(sel); }

  function updateQueryState(value) {
    root.classList.toggle("tbp-has-query", !!String(value || "").trim());
  }

  function openDropdown() {
    wrapper.classList.remove("tbp-closing");
    wrapper.classList.remove("tbp-hidden");
  }

  function clearCategoryButtons() {
    const existing = root.querySelector(".tbp-cat-buttons");
    if (existing) existing.remove();
  }

  function closeDropdown() {
    if (wrapper.classList.contains("tbp-hidden") || wrapper.classList.contains("tbp-closing")) return;
    clearCategoryButtons();
    wrapper.classList.add("tbp-closing");
    window.setTimeout(() => {
      wrapper.classList.add("tbp-hidden");
      wrapper.classList.remove("tbp-closing");
    }, 160);
  }

  // ======================
  // RENDER BRANDS
  // ======================

  function renderBrands(brands) {
    const el = q(".tbp-brands");
    q(".tbp-left-label").classList.remove("tbp-hidden");
    el.innerHTML = (brands || [])
      .slice(0, 20)
      .map(b => {
        const title = b?.title || b?.name || b?.vendor || "";
        return `<div data-tbp-brand="${title.replace(/"/g, "&quot;")}">${title}</div>`;
      })
      .join("") || `<div class="tbp-empty-brand">No Brands Found</div>`;
  }

  // ======================
  // RENDER COLLECTIONS
  // ======================

  function renderBottomCollections(collections) {
    const list = (collections || [])
      .map(c => {
        if (typeof c === "string") return { title: c, handle: "" };
        if (!c) return null;
        return {
          ...c,
          title: c.title || c.name || c.label || c.handle || "",
          handle: c.handle || c.slug || "",
        };
      })
      .filter(c => c && c.title);

    applyCollectionsSlot(list.length ? "COLLECTIONS" : null);
    if (!list.length) return 0;

    q(".tbp-collections").innerHTML = list
      .slice(0, 5)
      .map(c => {
        const url = c.url || (c.handle
          ? `/collections/${encodeURIComponent(c.handle)}`
          : `/search?q=${encodeURIComponent(c.title)}`);
        return `<span class="tbp-collection-item" onclick="window.location='${escapeHtml(url)}'"><span class="tbp-item-hash" aria-hidden="true">#</span><span class="tbp-item-text">${escapeHtml(c.title)}</span></span>`;
      })
      .join("");
    return list.length;
  }

  // ======================
  // RENDER SUGGESTIONS
  // ======================

  function renderSuggestions(suggestions) {
    const list = (suggestions || [])
      .map(s => typeof s === "string" ? { text: s } : s)
      .filter(s => s && (s.text || s.title || s.name));
    const labelEl = q(".tbp-typo-label");
    const listEl = q(".tbp-typo-suggestions");
    if (!labelEl || !listEl) return 0;
    listEl.innerHTML = list
      .slice(0, 8)
      .map(s => {
        const text = s.text || s.title || s.name || "";
        const url = s.url || `/search?q=${encodeURIComponent(text)}`;
        return `<span class="tbp-typo-item" data-tbp-typo-suggestion="true" data-tbp-typo-url="${escapeHtml(url)}"><span class="tbp-item-hash tbp-typo-hash" aria-hidden="true">#</span><span class="tbp-item-text">${escapeHtml(text)}</span></span>`;
      })
      .join("");
    labelEl.classList.toggle("tbp-hidden", !list.length);
    listEl.classList.toggle("tbp-hidden", !list.length);
    listEl.classList.remove("tbp-loading");
    return list.length;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clearTypoSuggestions() {
    const labelEl = q(".tbp-typo-label");
    const listEl = q(".tbp-typo-suggestions");
    if (!labelEl || !listEl) return;
    labelEl.classList.add("tbp-hidden");
    listEl.classList.add("tbp-hidden");
    listEl.classList.remove("tbp-loading");
    listEl.innerHTML = "";
  }

  function reserveTypoSuggestionsSlot() {
    const labelEl = q(".tbp-typo-label");
    const listEl = q(".tbp-typo-suggestions");
    if (!labelEl || !listEl) return;
    labelEl.classList.add("tbp-hidden");
    listEl.classList.add("tbp-hidden");
    listEl.classList.remove("tbp-loading");
    listEl.innerHTML = "";
  }

  function renderTypoSuggestions(suggestions) {
    const labelEl = q(".tbp-typo-label");
    const listEl = q(".tbp-typo-suggestions");
    if (!labelEl || !listEl) return;
    const collectionsEl = q(".tbp-collections");
    const visibleCollections = !collectionsEl || collectionsEl.classList.contains("tbp-hidden") || collectionsEl.style.display === "none"
      ? 0
      : collectionsEl.querySelectorAll("span").length || 0;
    const renderedCollections = Math.min(visibleCollections, 5);
    const limit = Math.max(5, Math.min(10, 10 - renderedCollections));
    const html = (suggestions || [])
      .slice(0, limit)
      .map((item) => {
        const text = item?.text || "";
        const url = item?.url || `/search?q=${encodeURIComponent(text)}`;
        if (!text) return "";
        return `<span class="tbp-typo-item" data-tbp-typo-suggestion="true" data-tbp-typo-url="${escapeHtml(url)}"><span class="tbp-item-hash tbp-typo-hash" aria-hidden="true">#</span><span class="tbp-item-text">${escapeHtml(text)}</span></span>`;
      })
      .join("\n");
    if (html) {
      labelEl.classList.remove("tbp-hidden");
      listEl.classList.remove("tbp-hidden");
      listEl.classList.remove("tbp-loading");
      listEl.innerHTML = html;
    } else {
      clearTypoSuggestions();
    }
  }

  async function loadTypoSuggestions(query) {
    if (!query || query.trim().length < 2) {
      clearTypoSuggestions();
      return;
    }
    if (typoSuggestionController) typoSuggestionController.abort();
    typoSuggestionController = new AbortController();
    try {
      const url = `${API}/typo-suggestions?shop=${encodeURIComponent(shop)}&q=${encodeURIComponent(query)}&limit=12&domain=${encodeURIComponent(location.origin)}`;
      const res = await fetch(url, { signal: typoSuggestionController.signal });
      if (!res.ok) {
        clearTypoSuggestions();
        return;
      }
      const data = await res.json();
      if (data.enabled && Array.isArray(data.suggestions) && data.suggestions.length) {
        renderTypoSuggestions(data.suggestions);
      } else {
        clearTypoSuggestions();
      }
    } catch (err) {
      if (err.name !== "AbortError") clearTypoSuggestions();
    }
  }

  // ======================
  // SHOW / HIDE COLLECTIONS SLOT
  // ======================

  function applyCollectionsSlot(label, content) {
    const labelEl = q(".tbp-bottom-label");
    const colEl = q(".tbp-collections");
    if (!label) {
      labelEl.classList.add("tbp-hidden");
      colEl.classList.add("tbp-hidden");
      colEl.innerHTML = "";
    } else {
      labelEl.classList.remove("tbp-hidden");
      colEl.classList.remove("tbp-hidden");
      labelEl.innerText = label;
      if (content === "hide") {
        colEl.innerHTML = "";
      }
    }
  }

  function prepareSearchLayout(clearSuggestions = true) {
    openDropdown();
    clearCategoryButtons();
    q(".tbp-left-label").classList.remove("tbp-hidden");
    q(".tbp-right-label").classList.remove("tbp-hidden");
    q(".tbp-left-label").innerText = "BRANDS";
    q(".tbp-right-label").innerText = "PRODUCTS";
    applyCollectionsSlot(null);
    if (clearSuggestions) clearTypoSuggestions();
  }

  function formatPrice(v) {
    return (Number(v) || 0).toLocaleString("en-US");
  }

  // ======================
  // RENDER CATEGORY BUTTONS
  // =====================
  // ======================
  // CATEGORY BUTTONS
  // ======================

  const CATEGORY_TAGS = [
    { label: "Festive", tag: "festive", aliases: ["festive", "festive wear", "festive collection"] },
    { label: "Co-ord Set", tag: "co-ord set", aliases: ["co-ord set", "co ord set", "coord set", "co-ord", "co ord", "coord"] },
    { label: "Formals", tag: "formals", aliases: ["formals", "formal", "formal wear", "semi formal"] },
    { label: "Luxury Pret", tag: "luxury pret", aliases: ["luxury pret", "luxury-pret", "premium pret"] },
    { label: "Luxury", tag: "luxury", productType: "unstitched", aliases: ["luxury", "unstitched luxury", "luxury unstitched"] },
    { label: "Casuals", tag: "casuals", aliases: ["casuals", "casual", "daily wear", "everyday"] },
  ];

  function normalizeCategoryText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function productCategoryText(product) {
    const parts = [
      product?.title,
      product?.vendor,
      product?.productType,
      product?.product_type,
      product?.type,
      product?.searchableText,
      ...(Array.isArray(product?.tags) ? product.tags : String(product?.tags || "").split(",")),
      ...(Array.isArray(product?.collections) ? product.collections.map(c => c?.title || c?.name || c?.handle || c) : []),
    ];
    return normalizeCategoryText(parts.filter(Boolean).join(" "));
  }

  function productTagTexts(product) {
    const rawTags = Array.isArray(product?.tags)
      ? product.tags
      : String(product?.tags || "").split(",");
    return rawTags.map(normalizeCategoryText).filter(Boolean);
  }

  function tagMatchesAlias(tag, alias) {
    const normalizedAlias = normalizeCategoryText(alias);
    return normalizedAlias && (
      tag === normalizedAlias ||
      (` ${tag} `).includes(` ${normalizedAlias} `)
    );
  }

  function productCanonicalCategory(product) {
    const tags = productTagTexts(product);
    if (!tags.length) return "";
    const found = CATEGORY_TAGS.find(category =>
      tags.some(tag => (category.aliases || [category.tag]).some(alias => tagMatchesAlias(tag, alias)))
    );
    return found ? normalizeCategoryText(found.tag) : "";
  }

  function productHasCategory(product, cat) {
    const text = productCategoryText(product);
    const wantedCategory = normalizeCategoryText(cat.tag);
    if (productCanonicalCategory(product) !== wantedCategory) return false;
    if (!cat.productType) return true;
    return text.includes(normalizeCategoryText(cat.productType));
  }

  function renderCategoryButtons(vendors, query, products = []) {
    clearCategoryButtons();

    if (!vendors || !vendors.length) return;

    const queryNorm = normalizeCategoryText(query);
    if (queryNorm.length < 2) return;

    const detectedVendors = (vendors || [])
      .map(vendor => {
        const title = vendor?.title || vendor?.name || vendor?.vendor || String(vendor || "");
        const norm = normalizeCategoryText(title);
        let score = 0;
        if (norm === queryNorm) score = 3;
        else if (norm.startsWith(queryNorm)) score = 2;
        else if (norm.includes(queryNorm) || queryNorm.includes(norm)) score = 1;
        return { vendor, title, norm, score };
      })
      .filter(item => item.title && item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.length - b.title.length);
    if (!detectedVendors.length) return;

    const firstVendor = detectedVendors[0].title;
    const vendorNorm = normalizeCategoryText(firstVendor);
    const vendorProducts = (products || []).filter(product => {
      const productVendor = normalizeCategoryText(product?.vendor);
      return productVendor === vendorNorm;
    });
    const sourceProducts = vendorProducts;
    let visibleCategories = CATEGORY_TAGS.filter(cat =>
      sourceProducts.some(product => productHasCategory(product, cat))
    );
    if (!visibleCategories.length) visibleCategories = CATEGORY_TAGS;
    if (!visibleCategories.length) return;

    const wrap = document.createElement("div");
    wrap.className = "tbp-cat-buttons";

    visibleCategories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "tbp-cat-btn";
      btn.textContent = cat.label;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const params = new URLSearchParams();
        params.set("q", firstVendor);
        params.set("tbp_category", cat.tag);
        if (cat.productType) params.set("tbp_category_type", cat.productType);
        window.location = `/search?${params.toString()}`;
      });
      wrap.appendChild(btn);
    });

    const targetLabel = q(".tbp-right-label");
    targetLabel.parentElement.insertBefore(wrap, targetLabel);
  }

  // ======================
  // RENDER PRODUCTS
  // ======================

  function renderProducts(products, showViewAll = false, query = "") {
    q(".tbp-right-label").classList.remove("tbp-hidden");
    const productLimit = 6;
    const list = (products || [])
      .slice(0, productLimit)
      .map((p, i) => {
        const title = escapeHtml(p.title || "");
        const vendor = escapeHtml(p.vendor || "");
        return `
        <div class="tbp-card" data-index="${i}">
          <img src="${escapeHtml(p.image || "")}" alt="${title}">
          <h4>${title}</h4>
          <span class="tbp-vendor${vendor ? "" : " tbp-vendor-empty"}">${vendor || "&nbsp;"}</span>

${Number(p.price) > 0
            ? `<p class="tbp-price">INR ${formatPrice(p.price)}</p>`
            : `
    <a
      class="tbp-whatsapp-btn"
      href="https://wa.me/919588460164?text=${encodeURIComponent(`Hi, I'm interested in ${p.title || ""}`)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="18px" height="18px" viewBox="0 0 24 24" version="1.1" id="svg8" inkscape:version="0.92.4 (5da689c313, 2019-01-14)" sodipodi:docname="1881161.svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path id="path4" inkscape:connector-curvature="0" d="M16.6,14c-0.2-0.1-1.5-0.7-1.7-0.8c-0.2-0.1-0.4-0.1-0.6,0.1c-0.2,0.2-0.6,0.8-0.8,1c-0.1,0.2-0.3,0.2-0.5,0.1c-0.7-0.3-1.4-0.7-2-1.2c-0.5-0.5-1-1.1-1.4-1.7c-0.1-0.2,0-0.4,0.1-0.5c0.1-0.1,0.2-0.3,0.4-0.4c0.1-0.1,0.2-0.3,0.2-0.4c0.1-0.1,0.1-0.3,0-0.4c-0.1-0.1-0.6-1.3-0.8-1.8C9.4,7.3,9.2,7.3,9,7.3c-0.1,0-0.3,0-0.5,0C8.3,7.3,8,7.5,7.9,7.6C7.3,8.2,7,8.9,7,9.7c0.1,0.9,0.4,1.8,1,2.6c1.1,1.6,2.5,2.9,4.2,3.7c0.5,0.2,0.9,0.4,1.4,0.5c0.5,0.2,1,0.2,1.6,0.1c0.7-0.1,1.3-0.6,1.7-1.2c0.2-0.4,0.2-0.8,0.1-1.2C17,14.2,16.8,14.1,16.6,14 M19.1,4.9C15.2,1,8.9,1,5,4.9c-3.2,3.2-3.8,8.1-1.6,12L2,22l5.3-1.4c1.5,0.8,3.1,1.2,4.7,1.2h0c5.5,0,9.9-4.4,9.9-9.9C22,9.3,20.9,6.8,19.1,4.9 M16.4,18.9c-1.3,0.8-2.8,1.3-4.4,1.3h0c-1.5,0-2.9-0.4-4.2-1.1l-0.3-0.2l-3.1,0.8l0.8-3l-0.2-0.3C2.6,12.4,3.8,7.4,7.7,4.9S16.6,3.7,19,7.5C21.4,11.4,20.3,16.5,16.4,18.9"></path></g></svg>
      Order via WhatsApp
    </a>
  `
          }
        </div>
      `;
      })
      .join("");

    const viewText = query ? `${query} View More` : "View More";
    const viewUrl = `/search?q=${encodeURIComponent(query)}`;
    const mobileViewMore = q(".tbp-mobile-view-more");

    q(".tbp-products").innerHTML = `
      ${list}
      ${showViewAll ? `
        <div class="tbp-view-all" onclick="window.location='${viewUrl}'">
          ${viewText} →
        </div>
      ` : ""}
    `;
    if (mobileViewMore) {
      mobileViewMore.classList.toggle("tbp-hidden", !showViewAll);
      mobileViewMore.innerHTML = showViewAll
        ? `<div class="tbp-view-all" onclick="window.location='${viewUrl}'">${viewText} &rarr;</div>`
        : "";
    }

    q(".tbp-products")
      .querySelectorAll(".tbp-card")
      .forEach((card, i) => {
        card.addEventListener("click", async () => {
          const p = products[i];
          await fetch(`${API}/analytics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "click",
              productId: p.id,
              productTitle: p.title,
              productImage: p.image,
              store: shop,
            }),
          });
          window.location = `/products/${p.handle}`;
        });
      });
  }

  // ======================
  // TRENDING
  // ======================

  function normalizeTrendingPayload(brandData, prodData, colData, sugData) {
    return {
      brands: Array.isArray(brandData) ? brandData : brandData.brands || brandData.data || [],
      products: Array.isArray(prodData) ? prodData : prodData.products || prodData.data || [],
      collections: Array.isArray(colData) ? colData : colData.collections || [],
      suggestions: Array.isArray(sugData) ? sugData : sugData.suggestions || sugData.data || [],
    };
  }

  function renderTrendingPayload(data) {
    if (!data) return;
    q(".tbp-left-label").innerText = "TRENDING BRANDS";
    q(".tbp-right-label").innerText = "TRENDING NOW";
    renderBrands(data.brands);
    renderProducts(data.products, false);
    renderBottomCollections(data.collections);
    renderSuggestions(data.suggestions);
  }

  async function prefetchTrending() {
    if (trendingCache) return trendingCache;
    if (trendingPromise) return trendingPromise;
    trendingPromise = (async () => {
      const [brandRes, productRes, colRes, sugRes] = await Promise.all([
        fetch(`${API}/trending-brands?store=${shop}`),
        fetch(`${API}/trending?store=${shop}`),
        fetch(`${API}/trending-collections?store=${shop}`),
        fetch(`${API}/suggestions?store=${shop}`).catch(() => null),
      ]);
      const [brandData, prodData, colData] = await Promise.all([
        brandRes.json(),
        productRes.json(),
        colRes.json(),
      ]);
      const sugData = sugRes && sugRes.ok ? await sugRes.json().catch(() => []) : [];
      trendingCache = normalizeTrendingPayload(brandData, prodData, colData, sugData);
      return trendingCache;
    })().catch((err) => {
      if (err.name !== "AbortError") console.error(err);
      return null;
    }).finally(() => {
      trendingPromise = null;
    });
    return trendingPromise;
  }

  async function loadTrending() {
    if (trendingCache) {
      renderTrendingPayload(trendingCache);
      return;
    }
    const myGen = ++renderGen; // snapshot — if user types, renderGen will differ
    try {
      const [brandRes, productRes, colRes, displayRes] = await Promise.all([
        fetch(`${API}/trending-brands?store=${shop}`),
        fetch(`${API}/trending?store=${shop}`),
        fetch(`${API}/trending-collections?store=${shop}`),
        fetch(`${API}/display-settings?store=${shop}`).catch(() => null),
      ]);

      // update display config regardless
      if (displayRes && displayRes.ok) {
        const d = await displayRes.json().catch(() => ({}));
        displayConfig = {
          showTrendingCollections: d.showTrendingCollections !== false,
          showSuggestions: d.showSuggestions === true,
        };
      }

      // user typed since this trending load started — abort render
      if (renderGen !== myGen) return;

      const brandData = await brandRes.json();
      const prodData = await productRes.json();
      const colData = await colRes.json();

      const brands = Array.isArray(brandData) ? brandData : brandData.brands || brandData.data || [];
      const products = Array.isArray(prodData) ? prodData : prodData.products || prodData.data || [];
      const collections = Array.isArray(colData) ? colData : colData.collections || [];

      q(".tbp-left-label").innerText = "TRENDING BRANDS";
      q(".tbp-right-label").innerText = "TRENDING NOW";

      renderBrands(brands);
      renderProducts(products, false);

      renderBottomCollections(collections);

      const sugRes = await fetch(`${API}/suggestions?store=${shop}`).catch(() => null);
      const sugData = sugRes && sugRes.ok ? await sugRes.json().catch(() => []) : [];
      if (renderGen !== myGen) return;
      const list = Array.isArray(sugData) ? sugData : sugData.suggestions || sugData.data || [];
      renderSuggestions(list);

    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }
  }

  // ======================
  // SEARCH
  // ======================

  function renderSearchData(data, q_) {
    const collections = Array.isArray(data.collections)
      ? data.collections
      : (data.collections?.data || data.collections?.items || []);
    const products = data.products || [];
    const vendors = data.vendors || [];

    q(".tbp-left-label").innerText = "BRANDS";
    q(".tbp-right-label").innerText = "PRODUCTS";
    renderBrands(vendors);

    let finalCollections = collections;
    if (!finalCollections.length) {
      const qNorm = normalizeCategoryText(q_);
      const matchedVendor = (vendors || [])
        .map(vendor => {
          const title = vendor?.title || vendor?.name || vendor?.vendor || String(vendor || "");
          const norm = normalizeCategoryText(title);
          const score = norm === qNorm ? 3 : (norm.startsWith(qNorm) ? 2 : (norm.includes(qNorm) ? 1 : 0));
          return { vendor, title, norm, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)[0];
      const matchedVendorTitle = matchedVendor ? matchedVendor.title : "";
      const vendorCollections = Array.isArray(data.collectionsByVendor)
        ? data.collectionsByVendor
        : (data.collectionsByVendor?.data || data.collectionsByVendor?.items || []);
      finalCollections = matchedVendorTitle
        ? vendorCollections
          .filter(c => !c?.vendor || normalizeCategoryText(c.vendor).includes(normalizeCategoryText(matchedVendorTitle)))
          .slice(0, 10)
        : [];
    }

    renderBottomCollections(finalCollections);
    renderProducts(products, true, q_);
    renderCategoryButtons(vendors, q_, products);
  }

  const tbpSearchFn = async function (q_, exactVendor = false) {
    if (currentController) currentController.abort();
    currentController = new AbortController();

    if (!q_) return;

    isSearching = true;
    if (input.value !== q_) input.value = q_;
    updateQueryState(q_);
    prepareSearchLayout(false);
    const cacheKey = `${exactVendor ? "vendor" : "query"}:${String(q_).trim().toLowerCase()}`;
    if (searchResultCache[cacheKey]) {
      renderSearchData(searchResultCache[cacheKey], q_);
      isSearching = false;
      return;
    }
    try {
      const res = await fetch(
        `${API}/search?q=${encodeURIComponent(q_)}&shop=${shop}&exactVendor=${exactVendor}`,
        { signal: currentController.signal }
      );
      const data = await res.json();

      fetch(`${API}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "search", query: q_, store: shop }),
      });

      searchResultCache[cacheKey] = data;
      renderSearchData(data, q_);

      // during search always show collections — suggestions only on idle (input click)
      isSearching = false;

    } catch (err) {
      isSearching = false;
      if (err.name !== "AbortError") console.error(err);
    }
  };

  // ======================
  // ANIMATED PLACEHOLDER
  // ======================

  const placeholders = [
    "Search for brands...",
    "Search collections...",
    "Search products...",
    "Find your favourite brand...",
    "Discover new arrivals...",
    "Search for brands, collections, and more...",
  ];

  let phIdx = 0;
  let phChar = 0;
  let phDeleting = false;
  let phTimer;

  function tickPlaceholder() {
    if (document.activeElement === input || input.value) return;
    const text = placeholders[phIdx];

    if (!phDeleting) {
      phChar++;
      input.setAttribute("placeholder", text.slice(0, phChar));
      if (phChar === text.length) {
        phDeleting = true;
        phTimer = setTimeout(tickPlaceholder, 1800);
        return;
      }
      phTimer = setTimeout(tickPlaceholder, 75);
    } else {
      phChar--;
      input.setAttribute("placeholder", text.slice(0, phChar));
      if (phChar === 0) {
        phDeleting = false;
        phIdx = (phIdx + 1) % placeholders.length;
        phTimer = setTimeout(tickPlaceholder, 380);
        return;
      }
      phTimer = setTimeout(tickPlaceholder, 35);
    }
  }

  tickPlaceholder();
  prefetchTrending().then((data) => {
    if (!data || input.value.trim() || isSearching) return;
    renderTrendingPayload(data);
  });

  // ======================
  // EVENTS
  // ======================

  // brand + suggestion clicks — event delegation per instance
  q(".tbp-brands").addEventListener("click", (e) => {
    const brand = e.target.closest("[data-tbp-brand]")?.dataset?.tbpBrand;
    if (brand) tbpSearchFn(brand, true);
  });

  q(".tbp-collections").addEventListener("click", (e) => {
    const sug = e.target.closest("[data-tbp-suggestion]")?.dataset?.tbpSuggestion;
    if (sug) tbpSearchFn(sug);
  });

  q(".tbp-typo-suggestions").addEventListener("click", (e) => {
    const typoUrl = e.target.closest("[data-tbp-typo-suggestion]")?.dataset?.tbpTypoUrl;
    if (typoUrl) window.location = typoUrl;
  });

  input.addEventListener("focus", () => {
    clearTimeout(phTimer);
    input.setAttribute("placeholder", "");
  });

  input.addEventListener("blur", () => {
    if (!input.value.trim()) {
      phChar = 0;
      phDeleting = false;
      setTimeout(tickPlaceholder, 600);
    }
  });

  input.addEventListener("click", (e) => {
    e.stopPropagation();
    openDropdown();
    isSearching = false;
    updateQueryState(input.value);
    if (!input.value.trim()) loadTrending();
  });

  input.addEventListener("input", (e) => {
    const val = e.target.value;
    updateQueryState(val);
    openDropdown();
    clearTimeout(searchTimeout);
    clearTimeout(typoSuggestionTimeout);

    if (!val.trim()) {
      isSearching = false;
      clearCategoryButtons();
      clearTypoSuggestions();
      loadTrending();
      return;
    }

    isSearching = true;
    renderGen++;  // invalidate any in-flight loadTrending render
    prepareSearchLayout();
    typoSuggestionTimeout = setTimeout(() => loadTypoSuggestions(val), 60);
    searchTimeout = setTimeout(() => tbpSearchFn(val), 180);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = input.value.trim();
      if (val) window.location = `/search?q=${encodeURIComponent(val)}`;
    }
  });

  wrapper.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("pointerdown", (e) => {
    if (!root.contains(e.target)) closeDropdown();
  });

  document.addEventListener("click", () => {
    closeDropdown();
  });
}

// ============================
// BOOTSTRAP
// ============================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllTBPRoots);
} else {
  initAllTBPRoots();
}
document.addEventListener("shopify:section:load", initAllTBPRoots);
document.addEventListener("pageload", initAllTBPRoots);
