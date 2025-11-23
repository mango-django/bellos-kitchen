import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GUI } from "lil-gui";

// Inject CSS (scrollbars + mobile layout)
const styleEl = document.createElement("style");
styleEl.innerHTML = `
  #category-row::-webkit-scrollbar {
    display: none;
  }
  #category-row {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Responsive layout */
  @media (max-width: 768px) {
    #left-panel {
      display: none !important;
    }
    #mobile-bottom-sheet {
      display: flex !important;
    }
    #kitchen-body {
      flex-direction: column;
    }
    #kitchen-bottom-bar {
      display: none !important;
    }
  }

  @media (min-width: 769px) {
    #left-panel {
      display: flex !important;
    }
    #mobile-bottom-sheet {
      display: none !important;
    }
  }
`;
document.head.appendChild(styleEl);

function setLogoSize(newSize) {
  document.documentElement.style.setProperty("--logo-width", newSize + "px");
}
const modelUrl = new URL("./models/room.glb", import.meta.url).href;

// ------------------
// User Controls Setup & Texture Options
// ------------------
const userControls = {
  wallColor: "#ffffff",
};

const currentIndices = {
  floor: 0,
  worktop: 0,
  cupboards: 0,
  backsplash: 0,
  stools: 0,
  wall: 0,
};

// Cupboards custom colour (default)
let cupboardColor = "#d3d3d3";
// Store baked cupboards material so we can tint it
let cupboardsMaterial = null;
// Wall custom colour (default)
let wallCustomColor = "#ffffff";
// Store wall material so we can tint it

const wallColorOptions = {
  White: "#ffffff",
  "Off White": "#f7f6f1",
  "Light Grey": "#d3d3d3",
  "Grey Tone 1": "#6c6666",
  "Grey Tone 2": "#565656",
  "Grey Tone 3": "#656969",
  "Grey Tone 4": "#686868",
  "Grey Tone 5": "#b1abab",
  "Grey Tone 6": "#d0cccc",
  "Brown Tone 1": "#2b241f",
  Black: "#101010",
};

const floorTextureOptions = {
  "Alessandro" :"/textures/floorFolder/alessandro.webp",
  "Vogue": "/textures/floorFolder/vogue-01.webp",
  "Living": "/textures/floorFolder/living_01.webp",
  "Alpaca": "/textures/floorFolder/alpaca-white.webp",
  "Lanta Grey" : "/textures/floorFolder/lanta_grey_1000x1000.webp",
  "Lanta White": "/textures/floorFolder/lanta_white_1000x1000.webp",
  "Lanta Cream": "/textures/floorFolder/lanta_cream_1000x1000.webp",
  "Arlington Grey": "/textures/floorFolder/arlington_grey_600x1200.webp",
  "Arlington White": "/textures/floorFolder/arlington_white_600x1200.webp",
  "Bronx Ceramic Grey": "/textures/floorFolder/bronx_ceramic_grey_600x600.webp",
  "Creed Grey": "/textures/floorFolder/creed_grey_300x600.webp",
  "Rosko Anthracite": "/textures/floorFolder/rosko_anthracite_300x600.webp",
  "Rosko Cream": "/textures/floorFolder/rosko_cream_300x600.webp",
  "Rosko Grey": "/textures/floorFolder/rosko_grey_600x300.webp",
  "Rosko Mink": "/textures/floorFolder/rosko_mink_600x300.webp",
  "Sanders Dark Grey": "/textures/floorFolder/sanders_dark_grey_matt_300x600.webp",
  "Bartlett Bay Black": "/textures/floorFolder/bartlet-bay-stone.webp",
  "Bartlett Bay Cream": "/textures/floorFolder/bartlett-bay-cream.webp",
  "Bartlett Bay Grey": "/textures/floorFolder/bartlett-bay-grey.webp",
  "Calcatta Bento Marble": "/textures/floorFolder/calcatta-bento-marble.webp",
  "Lakeside Cement Dark Grey": "/textures/floorFolder/lakeside-cement-dark-grey.webp",
  "Lakeside Cement Black": "/textures/floorFolder/lakeside-cement-black.webp",
  "Outer Stone Beige": "/textures/floorFolder/outer-stone-beige.webp",
  "Camo Stone Black": "/textures/floorFolder/carmo-stone-black.webp",
};

const worktopTextureOptions = {
  "White Laquer": "/textures/worktopFolder/Kitchen_Worktop_Bake.webp",
  "Sienna Marble Grey": "/textures/worktopFolder/Kitchen_Worktop_Bake_1.webp",
  "Caeserstone Attica": "/textures/worktopFolder/Kitchen_Worktop_Bake_2.webp",
  "Jura Anthracite": "/textures/worktopFolder/Kitchen_Worktop_Bake_3.webp",
  "Pietra Grigia": "/textures/worktopFolder/Kitchen_Worktop_Bake_4.webp",
  "Pietra Grigia Black": "/textures/worktopFolder/Kitchen_Worktop_Bake_5.webp",
  "Granite Braganza": "/textures/worktopFolder/Kitchen_Worktop_Bake_7.webp",
  "Concrete Chicago": "/textures/worktopFolder/Kitchen_Worktop_Bake_9.webp",
  "Inox Metallic": "/textures/worktopFolder/Kitchen_Worktop_Bake_10.webp",
  "Linen Anthracite": "/textures/worktopFolder/Kitchen_Worktop_Bake_12.webp",
  "Chromix Bronze": "/textures/worktopFolder/Kitchen_Worktop_Bake_15.webp",
  "Rock Metal": "/textures/worktopFolder/Kitchen_Worktop_Bake_18.webp",
  "Oak Valley": "/textures/worktopFolder/Kitchen_Worktop_Bake_20.webp",
  "Oak Soria": "/textures/worktopFolder/Kitchen_Worktop_Bake_21.webp",
};

// Kept for backwards compatibility, but no longer used for UI
const cupboardsTextureOptions = {
  "Light Grey": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake.webp",
  "Medium Grey": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_4.webp",
  "Dark Grey": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_5.webp",
  "Beech Natural": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_1.webp",
  "Elm Tossini Grey": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_2.webp",
  "Oak Denver Truffle": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_3.webp",
  "Oak Denver Graphite": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_8.webp",
  "Marine Blue": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_9.webp",
  "Cool Mint": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_10.webp",
  "Blush Red": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_11.webp",
  "Lucious Green": "/textures/cupboardsFolder/Kitchen_Cupboards_Bake_12.webp",
};

const backsplashTextureOptions = {
  "Metro Stone Bone": "/textures/backsplashFolder/metro-stone-bone.webp",
  "Metro Stone Grey": "/textures/backsplashFolder/metro-stone-grey.webp",
  "Venario Marble": "/textures/backsplashFolder/venato-marble.webp",
  "Alessandro": "/textures/backsplashFolder/alessandro.webp",
  "Jakarta Marble": "/textures/backsplashFolder/jakarta-marble.webp",
  "Marenna Copper": "/textures/backsplashFolder/marenna-copper.webp",
  "Marenna Sand": "/textures/backsplashFolder/marenna-sand.webp",
  "Marenna Dark Brown": "/textures/backsplashFolder/marenna-dark-brown.webp",
  "Dayton Metal Beige": "/textures/backsplashFolder/dayton-metal-beige.webp",
  "Dayton Metal Brown": "/textures/backsplashFolder/dayton-metal-brown.webp",
  "Dayton Metal Light Grey": "/textures/backsplashFolder/dayton-metal-light-grey.webp",
  "Dayton Metal Taupe": "/textures/backsplashFolder/dayton-metal-taupe.webp",
  "Midicia Marble": "/textures/backsplashFolder/midicia-marble.webp",
  "Mani Marble Dark Grey": "/textures/backsplashFolder/mani-marble-dark-grey.webp",
  "Mani Marble Light Grey": "/textures/backsplashFolder/mani-marble-light-grey.webp",
};

const stoolsTextureOptions = {
  "White with Chrome": "/textures/stoolsFolder/Kitchen_Stool_Bake_1.webp",
  "Black with Chrome": "/textures/stoolsFolder/Kitchen_Stool_Bake_2.webp",
  "Dark Brown with Chrome": "/textures/stoolsFolder/Kitchen_Stool_Bake_3.webp",
  "Dark Blue with Chrome": "/textures/stoolsFolder/Kitchen_Stool_Bake_4.webp",
};

// ----------
// Thumbnails
// ----------
const floorThumbnailOptions = {
  Alissandro: "/thumbnails/fl_alissandro.webp",
  Vogue: "/thumbnails/fl_vogue.webp",
  Living: "/thumbnails/fl_living.webp",
  Alpaca: "/thumbnails/fl_alpaca.webp",
  "Lanta Grey": "/thumbnails/fl_lanta_grey.webp",
  "Lanta White": "/thumbnails/fl_lanta_white.jpg",
  "Lanta Cream": "/thumbnails/fl_lanta_cream.jpg",
  "Arlington Grey": "/thumbnails/fl_arlington_grey.jpg",
  "Arlington White": "/thumbnails/fl_arlington_white.jpg",
  "Bronx Ceramic Grey": "/thumbnails/fl_bronx_ceramic_grey.jpg",
  "Creed Grey": "/thumbnails/fl_creed_grey.jpg",
  "Rosko Anthracite": "/thumbnails/fl_rosko_anthracite.jpg",
  "Rosko Cream": "/thumbnails/fl_rosko_cream.jpg",
  "Rosko Grey": "/thumbnails/fl_rosko_grey.jpg",
  "Rosko Mink": "/thumbnails/fl_rosko_mink.jpg",
  "Sanders Dark Grey": "/thumbnails/fl_sanders_dark_grey.jpg",
  "Bartlett Bay Black": "/thumbnails/fl_bartlett_bay_black.jpg",
  "Bartlett Bay Cream": "/thumbnails/fl_bartlett_bay_cream.jpg",
  "Bartlett Bay Grey": "/thumbnails/fl_bartlett_bay_grey.jpg",
  "Calcatta Bento Marble": "/thumbnails/fl_calcatta_bento_marble.jpg",
  "Lakeside Cement Dark Grey": "/thumbnails/fl_lakeside_cement_dark_grey.jpg",
  "Lakeside Cement Black": "/thumbnails/fl_lakeside_cement_black.jpg",
  "Outer Stone Beige": "/thumbnails/fl_outer_stone_beige.jpg",
};

const worktopThumbnailOptions = {
  "White Laquer": "/thumbnails/w_white_laquer.webp",
  "Sienna Marble Grey": "/thumbnails/w_sienna_marble_grey.webp",
  "Caeserstone Attica": "/thumbnails/w_caeserstone_attica.webp",
  "Jura Anthracite": "/thumbnails/w_jura_anthracite.webp",
  "Pietra Grigia": "/thumbnails/w_pietra_grigia.webp",
  "Pietra Grigia Black": "/thumbnails/w_pietra_grigia_black.webp",
  "Granite Braganza": "/thumbnails/w_granite_braganza.webp",
  "Concrete Chicago": "/thumbnails/w_concrete_chicago.webp",
  "Inox Metallic": "/thumbnails/w_inox_metallic.webp",
  "Linen Anthracite": "/thumbnails/w_linen_anthracite.webp",
  "Chromix Bronze": "/thumbnails/w_chromix_bronze.webp",
  "Rock Metal": "/thumbnails/w_rock_metal.webp",
  "Oak Valley": "/thumbnails/w_oak_valley.webp",
  "Oak Soria": "/thumbnails/w_oak_soria.webp",
};

const cupboardsThumbnailOptions = {
  "Light Grey": "/thumbnails/cu_light_grey.webp",
  "Medium Grey": "/thumbnails/cu_medium_grey.webp",
  "Dark Grey": "/thumbnails/cu_dark_grey.webp",
  "Beech Natural": "/thumbnails/cu_beech_natural.webp",
  "Elm Tossini Grey": "/thumbnails/cu_elm_tossini_grey.webp",
  "Oak Denver Truffle": "/thumbnails/cu_oak_denver_truffle.webp",
  "Oak Denver Graphite": "/thumbnails/cu_oak_denver_graphite.webp",
  "Marine Blue": "/thumbnails/cu_marine_blue.webp",
  "Cool Mint": "/thumbnails/cu_cool_mint.webp",
  "Blush Red": "/thumbnails/cu_blush_red.webp",
  "Lucious Green": "/thumbnails/cu_lucious_green.webp",
};

const backsplashThumbnailOptions = {
  "Metro Stone Bone": "/thumbnails/bs_metro-bone.png",
  "Metro Stone Grey": "/thumbnails/bs_metro-grey.png",
  "Venario Marble": "/thumbnails/bs_venario-marble.png",
  "Alessandro": "/thumbnails/bs_alessandro.png",
  "Jakarta Marble": "/thumbnails/bs_jakarta-marble.png",
  "Marenna Copper": "/thumbnails/bs_marenna-copper.png",
  "Marenna Sand": "/thumbnails/bs_marenna-sand.png",
  "Marenna Dark": "/thumbnails/bs_marenna-dark.png",
  "Dayton Metal Beige": "/thumbnails/bs_dayton-metal-beige.png",
  "Dayton Metal Brown": "/thumbnails/bs_dayton-metal-brown.png",
  "Dayton Metal Light Grey": "/thumbnails/bs_dayton-metal-light-grey.png",
  "Dayton Metal Taupe": "/thumbnails/bs_dayton-metal-taupe.png",
  "Midicia Marble": "/thumbnails/bs_midicia-marble.png",
  "Mani Marble Dark Grey": "/thumbnails/bs_mani-dark-grey.png",
  "Mani Marble Light Grey": "/thumbnails/bs_mani-light-grey.png",

  
};

const stoolsThumbnailOptions = {
  "White with Chrome": "/thumbnails/st_white_with_chrome.webp",
  "Black with Chrome": "/thumbnails/st_black_with_chrome.webp",
  "Dark Brown with Chrome": "/thumbnails/st_dark_brown_with_chrome.webp",
  "Dark Blue with Chrome": "/thumbnails/st_blue_with_chrome.webp",
};

const wallColourThumbnailOptions = {
  White: "/thumbnails/wl_white.webp",
  "Off White": "/thumbnails/wl_off_white.webp",
  "Grey Tone 1": "/thumbnails/wl_grey_tone_1.webp",
  "Grey Tone 2": "/thumbnails/wl_grey_tone_2.webp",
  "Grey Tone 3": "/thumbnails/wl_grey_tone_3.webp",
  "Grey Tone 4": "/thumbnails/wl_grey_tone_4.webp",
  "Grey Tone 5": "/thumbnails/wl_grey_tone_5.webp",
  "Grey Tone 6": "/thumbnails/wl_grey_tone_6.webp",
  "Brown Tone 1": "/thumbnails/wl_brown_tone_1.webp",
  Black: "/thumbnails/wl_black.webp",
};

// ------------------
// Product URLs for "View in Store"
// ------------------
const productUrlMap = {
  Floor: {
    Alessandro: "https://bellosbespoketiles.co.uk/products/alessandro-2-sizes-1-colour-bellos-bespoke-tiles?_pos=1&_psq=al&_ss=e&_v=1.0",
    Vogue:"https://bellosbespoketiles.co.uk/products/vogue-1-size-24colours-bellos-bespoke-tiles?_pos=1&_psq=vogue&_ss=e&_v=1.0",
    Living: "https://bellosbespoketiles.co.uk/products/living-1-size-3-colours-bellos-bespoke-tiles?_pos=1&_psq=living&_ss=e&_v=1.0",
   Alpaca: "https://bellosbespoketiles.co.uk/products/alpaca-white-glazed-porcelain-bellos-bespoke-tiles?_pos=1&_psq=alp&_ss=e&_v=1.0",
   "Lanta Grey": "https://bellosbespoketiles.co.uk/products/lanta-grey-1000x1000-bellos-bespoke-tiles?_pos=3&_sid=24d499d47&_ss=r",
   "Lanta White": "https://bellosbespoketiles.co.uk/products/lanta-white-glazed-porcelain-1000x1000-bellos-bespoke-tiles?_pos=2&_sid=24d499d47&_ss=r",
    "Lanta Cream": "https://bellosbespoketiles.co.uk/products/lanta-cream-1000x1000-bellos-bespoke-tiles?_pos=1&_sid=24d499d47&_ss=r",
    "Arlington Grey": "https://bellosbespoketiles.co.uk/products/arlington-grey-glazed-porcelain-600x1200-bellos-bespoke-tiles?_pos=1&_psq=arlingt&_ss=e&_v=1.0",
    "Arlington White": "https://bellosbespoketiles.co.uk/products/arlington-white-glazed-porcelain-600x-1200-bellos-bespoke-tiles?_pos=2&_psq=arlingto&_ss=e&_v=1.0",
     "Arlington White": "https://bellosbespoketiles.co.uk/products/arlington-white-glazed-porcelain-600x-1200-bellos-bespoke-tiles?_pos=2&_psq=arlingto&_ss=e&_v=1.0",
    "Bronx Ceramic Grey": "https://bellosbespoketiles.co.uk/products/bronx-grey-ceramic-300x900-bellos-bespoke-tiles?_pos=1&_psq=bronx&_ss=e&_v=1.0",
    "Creed Grey": "https://bellosbespoketiles.co.uk/products/creed-grey-glazed-porcelain-600x600-bellos-bespoke-tiles?_pos=2&_psq=creed&_ss=e&_v=1.0",
    "Rosko Anthracite": "https://bellosbespoketiles.co.uk/products/rosko-anthracite-porcelain-297-x-597-bellos-bespoke-tiles?_pos=3&_psq=rosko&_ss=e&_v=1.0",
    "Rosko Cream": "https://bellosbespoketiles.co.uk/products/rosko-mink-porcelain-300x600-bellos-bespoke-tiles?_pos=2&_psq=rosko&_ss=e&_v=1.0",
    "Rosko Grey": "https://bellosbespoketiles.co.uk/products/rosko-grey-porcelain-297x597-bellos-bespoke-tiles?_pos=1&_psq=rosko&_ss=e&_v=1.0",
    "Rosko Mink": "https://bellosbespoketiles.co.uk/products/rosko-mink-porcelain-300x600-bellos-bespoke-tiles?_pos=2&_psq=rosko&_ss=e&_v=1.0",
    "Sanders Dark Grey": "https://bellosbespoketiles.co.uk/products/sanders-dark-grey-300x600-bellos-bespoke-tiles?_pos=1&_psq=sander&_ss=e&_v=1.0",
    "Bartlett Bay Black": "https://bellosbespoketiles.co.uk/products/bartlett-bay-stone-black-600x300-bellos-bespoke-tiles?_pos=2&_psq=Bartlett&_ss=e&_v=1.0",
    "Bartlett Bay Cream": "https://bellosbespoketiles.co.uk/products/bartlett-bay-stone-cream-600x300-bellos-bespoke-tiles?_pos=4&_psq=bartl&_ss=e&_v=1.0",
    "Bartlett Bay Grey": "https://bellosbespoketiles.co.uk/products/bartlett-bay-stone-grey-300x600-bellos-bespoke-tiles?_pos=3&_psq=bartlet&_ss=e&_v=1.0",
    "Calcatta Bento Marble": "https://bellosbespoketiles.co.uk/products/calcatta-bento-marble-600x600-bellos-bespoke-tiles?_pos=1&_psq=cal&_ss=e&_v=1.0",
    "Lakeside Cement Dark Grey": "https://bellosbespoketiles.co.uk/products/lakeside-cement-dark-grey-matt-300x600-bellos-bespoke-tiles?_pos=6&_psq=lakes&_ss=e&_v=1.0",
    "Lakeside Cement Black": "https://bellosbespoketiles.co.uk/products/lakeside-cement-black-matt-300x600-bellos-bespoke-tiles?_pos=5&_psq=lakeside&_ss=e&_v=1.0",
    "Outer Stone Beige": "https://bellosbespoketiles.co.uk/products/outer-stone-1-size-5-colours-bellos-bespoke-tiles?_pos=2&_psq=outer&_ss=e&_v=1.0",
    "Camo Stone Black": "https://bellosbespoketiles.co.uk/products/camo-stone-1-size-4-colours-bellos-bespoke-tiles?_pos=1&_psq=camo&_ss=e&_v=1.0",

  },
  Worktop: {},
  Cupboards: {},
  Backsplash: {
    "Metro Stone Bone": "https://bellosbespoketiles.co.uk/products/metro-stone-3-sizes-4-colours-bellos-bespoke-tiles?_pos=2&_psq=metro&_ss=e&_v=1.0",
    "Metro Stone Grey": "https://bellosbespoketiles.co.uk/products/metro-stone-3-sizes-4-colours-bellos-bespoke-tiles?_pos=2&_psq=metro&_ss=e&_v=1.0",
    "Venario Marble": "https://bellosbespoketiles.co.uk/products/venario-marble-1-colour-3-sizes?_pos=1&_psq=vena&_ss=e&_v=1.0",
    "Alessandro": "https://bellosbespoketiles.co.uk/products/alessandro-2-sizes-1-colour-bellos-bespoke-tiles?_pos=1&_psq=alessa&_ss=e&_v=1.0",
    "Jakarta Marble": "https://bellosbespoketiles.co.uk/products/jakarta-marble-600x300-bellos-bespoke-tiles?_pos=4&_psq=jakarta&_ss=e&_v=1.0",
    "Marenna Copper": "https://bellosbespoketiles.co.uk/products/marenna-copper-600x300-bellos-bespoke-tiles?_pos=5&_psq=marenna&_ss=e&_v=1.0",
    "Marenna Sand": "https://bellosbespoketiles.co.uk/products/marenna-sand-600x300-bellos-bespoke-tiles?_pos=6&_psq=marenna&_ss=e&_v=1.0",
    "Marenna Dark Brown": "https://bellosbespoketiles.co.uk/products/marenna-dark-brown-600x300-bellos-bespoke-tiles?_pos=7&_psq=marenna&_ss=e&_v=1.0",
    "Dayton Metal Beige": "https://bellosbespoketiles.co.uk/products/dayton-metal-beige-600x300-bellos-bespoke-tiles?_pos=8&_psq=dayton&_ss=e&_v=1.0",
    "Dayton Metal Brown": "https://bellosbespoketiles.co.uk/products/dayton-metal-brown-600x300-bellos-bespoke-tiles?_pos=9&_psq=dayton&_ss=e&_v=1.0",
    "Dayton Metal Light Grey": "https://bellosbespoketiles.co.uk/products/dayton-metal-light-grey-600x300-bellos-bespoke-tiles?_pos=10&_psq=dayton&_ss=e&_v=1.0",
    "Dayton Metal Taupe": "https://bellosbespoketiles.co.uk/products/dayton-metal-taupe-600x300-bellos-bespoke-tiles?_pos=11&_psq=dayton&_ss=e&_v=1.0",
    "Midicia Marble": "https://bellosbespoketiles.co.uk/products/midicia-marble-600x300-bellos-bespoke-tiles?_pos=12&_psq=midicia&_ss=e&_v=1.0",
    "Mani Marble Dark Grey": "https://bellosbespoketiles.co.uk/products/mani-marble-dark-grey-600x300-bellos-bespoke-tiles?_pos=13&_psq=mani&_ss=e&_v=1.0",
    "Mani Marble Light Grey": "https://bellosbespoketiles.co.uk/products/mani-marble-light-grey-600x300-bellos-bespoke-tiles?_pos=14&_psq=mani&_ss=e&_v=1.0",
  },
  Stools: {},
  "Wall Colour": {},
};

// ------------------
// Global placeholders / state
// ------------------
let controlPlaceholders = {};
let currentSearchTerm = "";
let currentCategory = "Floor";
const categoryFunctions = {
  Floor: { update: updateFloorTexture },
  Worktop: { update: updateWorktopTexture },
  Cupboards: { update: updateCupboardsTexture },
  Backsplash: { update: updateBacksplashTexture },
  Stools: { update: updateStoolsTexture },
  "Wall Colour": { update: updateWallColor },
};
let categorySelectDesktop = null;
let categorySelectMobile = null;

// helper to sync selects + updates
function onCategoryChange(newCategory) {
  currentCategory = newCategory;
  if (categorySelectDesktop && categorySelectDesktop.value !== newCategory) {
    categorySelectDesktop.value = newCategory;
  }
  if (categorySelectMobile && categorySelectMobile.value !== newCategory) {
    categorySelectMobile.value = newCategory;
  }
  categoryFunctions[currentCategory].update();
  updateOptionsRow();
}

// ------------------
// Helpers for current category data
// ------------------
function getCurrentCategoryData() {
  let optionsObj = {};
  let thumbObj = {};
  let index = 0;

  switch (currentCategory) {
    case "Floor":
      optionsObj = floorTextureOptions;
      thumbObj = floorThumbnailOptions;
      index = currentIndices.floor;
      break;
    case "Worktop":
      optionsObj = worktopTextureOptions;
      thumbObj = worktopThumbnailOptions;
      index = currentIndices.worktop;
      break;
    // Cupboards now use a colour picker, so we don't use optionsObj/thumbObj here
    case "Backsplash":
      optionsObj = backsplashTextureOptions;
      thumbObj = backsplashThumbnailOptions;
      index = currentIndices.backsplash;
      break;
    case "Stools":
      optionsObj = stoolsTextureOptions;
      thumbObj = stoolsThumbnailOptions;
      index = currentIndices.stools;
      break;
    case "Wall Colour":
      optionsObj = wallColorOptions;
      thumbObj = wallColourThumbnailOptions;
      index = currentIndices.wall;
      break;
  }

  const allOptionNames = Object.keys(optionsObj);
  if (!allOptionNames.length) return null;

  const selectedName =
    allOptionNames[
      Math.max(0, Math.min(index, allOptionNames.length - 1))
    ];

  return {
    optionsObj,
    thumbObj,
    allOptionNames,
    selectedName,
  };
}

// update bottom summary (mobile) + placeholder
function updateCurrentProductInfo(category, selectedName) {
  const titleEl = document.getElementById("current-product-title");
  const subtitleEl = document.getElementById("current-product-subtitle");
  const linkEl = document.getElementById("current-product-link");
  const thumbEl = document.getElementById("current-product-thumb");

  // Cupboards: use custom colour (no product name or image thumb)
  if (category === "Cupboards") {
    if (titleEl) {
      titleEl.textContent = "Custom colour";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "Cupboards";
    }
    if (thumbEl) {
      // hide the summary image completely for cupboards on mobile
      thumbEl.style.display = "none";
    }
    if (linkEl) {
      linkEl.style.display = "none";
      linkEl.removeAttribute("href");
    }
    const placeholder = document.getElementById("option-placeholder");
    if (placeholder) {
      placeholder.innerText = "Cupboards: " + cupboardColor.toUpperCase();
    }
    return;
  }

  // Wall Colour: when using the picker we show a solid swatch
  if (category === "Wall Colour" && selectedName === "Custom colour") {
    if (titleEl) {
      titleEl.textContent = "Custom wall colour";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "Wall Colour";
    }
    if (thumbEl) {
      thumbEl.style.display = "block";
      thumbEl.removeAttribute("src");
      thumbEl.style.background = wallCustomColor;
      thumbEl.style.border = "1px solid #e5e7eb";
    }
    if (linkEl) {
      linkEl.style.display = "none";
      linkEl.removeAttribute("href");
    }
    const placeholder = document.getElementById("option-placeholder");
    if (placeholder) {
      placeholder.innerText =
        "Wall Colour: " + wallCustomColor.toUpperCase();
    }
    return;
  }

  // non-cupboard, non-custom-wall categories – make sure summary thumb is visible
  if (thumbEl) {
    thumbEl.style.display = "";
  }

  if (titleEl) {
    titleEl.textContent = selectedName || "-";
  }
  if (subtitleEl) {
    subtitleEl.textContent = category;
  }

  // thumbnail
  if (thumbEl) {
    let thumbObj = {};
    let optionsObj = {};
    switch (category) {
      case "Floor":
        thumbObj = floorThumbnailOptions;
        optionsObj = floorTextureOptions;
        break;
      case "Worktop":
        thumbObj = worktopThumbnailOptions;
        optionsObj = worktopTextureOptions;
        break;
      case "Cupboards":
        thumbObj = cupboardsThumbnailOptions;
        optionsObj = cupboardsTextureOptions;
        break;
      case "Backsplash":
        thumbObj = backsplashThumbnailOptions;
        optionsObj = backsplashTextureOptions;
        break;
      case "Stools":
        thumbObj = stoolsThumbnailOptions;
        optionsObj = stoolsTextureOptions;
        break;
      case "Wall Colour":
        thumbObj = wallColourThumbnailOptions;
        optionsObj = wallColorOptions;
        break;
    }

    if (thumbObj[selectedName]) {
      thumbEl.src = thumbObj[selectedName];
      thumbEl.style.background = "transparent";
    } else if (category === "Wall Colour" && optionsObj[selectedName]) {
      thumbEl.removeAttribute("src");
      thumbEl.style.background = optionsObj[selectedName];
    } else if (optionsObj[selectedName]) {
      thumbEl.src = optionsObj[selectedName];
      thumbEl.style.background = "transparent";
    }
  }

  // product link
  if (linkEl) {
    const url =
      productUrlMap[category] && productUrlMap[category][selectedName];
    if (url) {
      linkEl.style.display = "inline-flex";
      linkEl.href = url;
    } else {
      linkEl.style.display = "none";
      linkEl.removeAttribute("href");
    }
  }

  // also update text at very bottom bar
  const placeholder = document.getElementById("option-placeholder");
  if (placeholder) {
    placeholder.innerText = category + ": " + selectedName;
  }
}


// ------------------
// Selection list for floating "Selections" dropdown
// ------------------
function updateSelectionList() {
  const selectionList = document.getElementById("selection-list");
  if (!selectionList) return;

  const selections = [];
  selections.push(
    `Floor: ${Object.keys(floorTextureOptions)[currentIndices.floor]}`
  );
  selections.push(
    `Worktop: ${Object.keys(worktopTextureOptions)[currentIndices.worktop]}`
  );
  // Cupboards now show the custom hex colour instead of a named option
  selections.push(`Cupboards: ${cupboardColor.toUpperCase()}`);
  selections.push(
    `Backsplash: ${Object.keys(backsplashTextureOptions)[currentIndices.backsplash]}`
  );
  selections.push(
    `Stools: ${Object.keys(stoolsTextureOptions)[currentIndices.stools]}`
  );
   selections.push(`Wall Colour: ${wallCustomColor.toUpperCase()}`);


  selectionList.innerHTML = selections
    .map((item) => `<p style="margin: 4px 0;">${item}</p>`)
    .join("");
}

// ------------------
// Helpers to apply a selection (used by list + thumbnails)
// ------------------
function applySelectionByName(optionName) {
  // Cupboards use a continuous colour picker, not discrete options
  if (currentCategory === "Cupboards") {
    return;
  }

  const data = getCurrentCategoryData();
  if (!data) return;

  const indexInAll = data.allOptionNames.indexOf(optionName);
  if (indexInAll === -1) return;

  switch (currentCategory) {
    case "Floor":
      currentIndices.floor = indexInAll;
      updateFloorTexture();
      break;
    case "Worktop":
      currentIndices.worktop = indexInAll;
      updateWorktopTexture();
      break;
    case "Cupboards":
      // no-op (handled by colour picker)
      break;
    case "Backsplash":
      currentIndices.backsplash = indexInAll;
      updateBacksplashTexture();
      break;
    case "Stools":
      currentIndices.stools = indexInAll;
      updateStoolsTexture();
      break;
    case "Wall Colour":
      currentIndices.wall = indexInAll;
      updateWallColor();
      break;
  }
  updateOptionsRow();
}

// ------------------
// Mobile thumbnail strip
// ------------------
function updateMobileThumbRow(data, filteredNames) {
  const thumbRow = document.getElementById("mobile-thumb-row");
  if (!thumbRow || !data) return;

  const { thumbObj, optionsObj, allOptionNames, selectedName } = data;
  const names =
    filteredNames && filteredNames.length ? filteredNames : allOptionNames;

  thumbRow.innerHTML = "";

  names.forEach((name) => {
    const isActive = name === selectedName;

    const btn = document.createElement("button");
    btn.style.border = "none";
    btn.style.background = "transparent";
    btn.style.padding = "0";
    btn.style.cursor = "pointer";

    const wrap = document.createElement("div");
    wrap.style.width = "64px";
    wrap.style.height = "64px";
    wrap.style.borderRadius = "12px";
    wrap.style.overflow = "hidden";
    wrap.style.border = isActive
      ? "2px solid #111827"
      : "1px solid #e5e7eb";
    wrap.style.backgroundColor = "#ffffff";

    const img = document.createElement("img");
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    if (currentCategory === "Wall Colour") {
      if (thumbObj[name]) {
        img.src = thumbObj[name];
      } else if (optionsObj[name]) {
        img.style.backgroundColor = optionsObj[name];
      }
    } else {
      img.src = thumbObj[name] ? thumbObj[name] : optionsObj[name];
    }

    wrap.appendChild(img);
    btn.appendChild(wrap);

    btn.addEventListener("click", () => {
      applySelectionByName(name);
    });

    thumbRow.appendChild(btn);
  });
}

// ------------------
// Cupboards colour picker UI (desktop + mobile)
// ------------------
function renderCupboardsColorUI() {
  const desktopContainer = document.getElementById("options-container-desktop");
  const mobileContainer = document.getElementById("options-container-mobile");

  if (desktopContainer) desktopContainer.innerHTML = "";
  if (mobileContainer) mobileContainer.innerHTML = "";

  // Desktop: label + colour picker + hex input
  if (desktopContainer) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "8px";

    const label = document.createElement("p");
    label.textContent = "Choose any cupboard colour";
    label.style.fontSize = "0.8rem";
    label.style.color = "#4b5563";
    label.style.margin = "0";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = cupboardColor;
    colorInput.style.width = "40px";
    colorInput.style.height = "40px";
    colorInput.style.border = "none";
    colorInput.style.padding = "0";
    colorInput.style.borderRadius = "8px";
    colorInput.style.background = "transparent";
    colorInput.style.cursor = "pointer";

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = cupboardColor.toUpperCase();
    hexInput.style.flex = "1";
    hexInput.style.fontSize = "0.8rem";
    hexInput.style.padding = "6px 10px";
    hexInput.style.borderRadius = "999px";
    hexInput.style.border = "1px solid #d1d5db";
    hexInput.style.outline = "none";

    function handleColorChange(newColor) {
      if (!/^#([0-9A-Fa-f]{6})$/.test(newColor)) return;
      cupboardColor = newColor.toLowerCase();
      colorInput.value = cupboardColor;
      hexInput.value = cupboardColor.toUpperCase();
      updateCupboardsColorInScene();
      updateCurrentProductInfo("Cupboards", "Custom colour");
      updateSelectionList();
    }

    colorInput.addEventListener("input", (e) => {
      handleColorChange(e.target.value);
    });

    hexInput.addEventListener("change", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) value = "#" + value;
      handleColorChange(value);
    });

    row.appendChild(colorInput);
    row.appendChild(hexInput);
    wrapper.appendChild(label);
    wrapper.appendChild(row);
    desktopContainer.appendChild(wrapper);
  }

  // Mobile: simple bar with colour input + hex label (no thumbnails)
  if (mobileContainer) {
    const label = document.createElement("p");
    label.textContent = "Cupboard colour";
    label.style.fontSize = "0.8rem";
    label.style.color = "#4b5563";
    label.style.margin = "0 0 4px 0";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    const colorInputMobile = document.createElement("input");
    colorInputMobile.type = "color";
    colorInputMobile.value = cupboardColor;
    colorInputMobile.style.width = "44px";
    colorInputMobile.style.height = "28px";
    colorInputMobile.style.border = "none";
    colorInputMobile.style.padding = "0";
    colorInputMobile.style.borderRadius = "999px";
    colorInputMobile.style.background = "transparent";

    const hexSpan = document.createElement("span");
    hexSpan.textContent = cupboardColor.toUpperCase();
    hexSpan.style.fontSize = "0.8rem";
    hexSpan.style.color = "#111827";

    function handleMobileColorChange(newColor) {
      if (!/^#([0-9A-Fa-f]{6})$/.test(newColor)) return;
      cupboardColor = newColor.toLowerCase();
      colorInputMobile.value = cupboardColor;
      hexSpan.textContent = cupboardColor.toUpperCase();
      updateCupboardsColorInScene();
      updateCurrentProductInfo("Cupboards", "Custom colour");
      updateSelectionList();
    }

    colorInputMobile.addEventListener("input", (e) => {
      handleMobileColorChange(e.target.value);
    });

    row.appendChild(colorInputMobile);
    row.appendChild(hexSpan);
    mobileContainer.appendChild(label);
    mobileContainer.appendChild(row);
  }

  // Clear the mobile thumbnail strip when Cupboards is selected
  const thumbRow = document.getElementById("mobile-thumb-row");
  if (thumbRow) {
    thumbRow.innerHTML = "";
  }
}


// ------------------
// Options list (desktop + mobile expanded panel)
// ------------------
function updateOptionsRow() {
  // Cupboards: use the colour picker UI instead of list
  if (currentCategory === "Cupboards") {
    renderCupboardsColorUI();
    return;
  }

  const data = getCurrentCategoryData();
  if (!data) return;

  const { optionsObj, thumbObj, allOptionNames, selectedName } = data;

  const desktopContainer = document.getElementById(
    "options-container-desktop"
  );
  const mobileContainer = document.getElementById("options-container-mobile");

  const containers = [desktopContainer, mobileContainer].filter(Boolean);
  containers.forEach((c) => (c.innerHTML = ""));

  const term = currentSearchTerm.trim().toLowerCase();
  const optionNames = term
    ? allOptionNames.filter((name) => name.toLowerCase().includes(term))
    : allOptionNames;

  if (!optionNames.length) {
    containers.forEach((container) => {
      if (!container) return;
      const empty = document.createElement("p");
      empty.textContent = "No results found.";
      empty.style.fontSize = "0.8rem";
      empty.style.color = "#6b7280";
      container.appendChild(empty);
    });
    updateMobileThumbRow(data, optionNames);
    return;
  }

  function createCard(optionName) {
    const isActive = optionName === selectedName;

    const card = document.createElement("div");
    card.className = "option-item";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.gap = "10px";
    card.style.padding = "8px 10px";
    card.style.borderRadius = "12px";
    card.style.border = isActive ? "2px solid #111827" : "1px solid #e5e7eb";
    card.style.backgroundColor = isActive ? "#f3f4ff" : "#ffffff";
    card.style.cursor = "pointer";

    const thumb = document.createElement("img");
    thumb.className = "option-thumbnail";
    thumb.style.width = "56px";
    thumb.style.height = "56px";
    thumb.style.borderRadius = "8px";
    thumb.style.objectFit = "cover";

    if (currentCategory === "Wall Colour") {
      if (thumbObj[optionName]) {
        thumb.src = thumbObj[optionName];
      } else if (optionsObj[optionName]) {
        thumb.style.backgroundColor = optionsObj[optionName];
      }
    } else {
      thumb.src = thumbObj[optionName]
        ? thumbObj[optionName]
        : optionsObj[optionName];
    }

    const textWrap = document.createElement("div");
    textWrap.style.display = "flex";
    textWrap.style.flexDirection = "column";
    textWrap.style.gap = "4px";

    const label = document.createElement("p");
    label.innerText = optionName;
    label.style.fontSize = "0.85rem";
    label.style.fontWeight = "500";
    label.style.margin = "0";

    const meta = document.createElement("p");
    meta.innerText = currentCategory;
    meta.style.fontSize = "0.75rem";
    meta.style.color = "#6b7280";
    meta.style.margin = "0";

    textWrap.appendChild(label);
    textWrap.appendChild(meta);

    const actions = document.createElement("div");
    actions.style.marginLeft = "auto";
    actions.style.display = "flex";
    actions.style.alignItems = "center";

    const linkUrl =
      productUrlMap[currentCategory] &&
      productUrlMap[currentCategory][optionName];

    if (linkUrl) {
      const viewBtn = document.createElement("button");
      viewBtn.title = "View in store";
      viewBtn.textContent = "↗";
      viewBtn.style.fontSize = "0.8rem";
      viewBtn.style.width = "26px";
      viewBtn.style.height = "26px";
      viewBtn.style.borderRadius = "999px";
      viewBtn.style.border = "1px solid #d1d5db";
      viewBtn.style.backgroundColor = "#ffffff";
      viewBtn.style.cursor = "pointer";
      viewBtn.style.display = "flex";
      viewBtn.style.alignItems = "center";
      viewBtn.style.justifyContent = "center";

      viewBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        window.open(linkUrl, "_blank");
      });

      actions.appendChild(viewBtn);
    }

    card.appendChild(thumb);
    card.appendChild(textWrap);
    card.appendChild(actions);

    card.addEventListener("click", () => {
      applySelectionByName(optionName);
    });

    return card;
  }

  containers.forEach((container) => {
    if (!container) return;
    optionNames.forEach((name) => {
      container.appendChild(createCard(name));
    });
  });

  updateMobileThumbRow(data, optionNames);
}

// ------------------
// Texture / colour update helpers
// ------------------
function updateFloorTexture() {
  const keys = Object.keys(floorTextureOptions);
  const selected = keys[currentIndices.floor];
  updateSelectionList();
  updateCurrentProductInfo("Floor", selected);
  textureLoader.load(floorTextureOptions[selected], (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (kitchenModel) {
      kitchenModel.traverse((child) => {
        if (child.isMesh && child.name.includes("Kitchen_Floor")) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    }
  });
}

function updateWorktopTexture() {
  const keys = Object.keys(worktopTextureOptions);
  const selected = keys[currentIndices.worktop];
  updateSelectionList();
  updateCurrentProductInfo("Worktop", selected);
  textureLoader.load(worktopTextureOptions[selected], (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (kitchenModel) {
      kitchenModel.traverse((child) => {
        if (child.isMesh && child.name.includes("Kitchen_Worktop")) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    }
  });
}

// apply cupboardColor to cupboards while keeping baked texture
function updateCupboardsColorInScene() {
  if (!cupboardsMaterial) return;
  cupboardsMaterial.color.set(cupboardColor);
  cupboardsMaterial.needsUpdate = true;
}

// Cupboards now use a continuous colour, not discrete textures
function updateCupboardsTexture() {
  updateSelectionList();
  updateCurrentProductInfo("Cupboards", "Custom colour");
  updateCupboardsColorInScene();
}


function updateBacksplashTexture() {
  const keys = Object.keys(backsplashTextureOptions);
  const selected = keys[currentIndices.backsplash];
  updateSelectionList();
  updateCurrentProductInfo("Backsplash", selected);
  textureLoader.load(backsplashTextureOptions[selected], (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (kitchenModel) {
      kitchenModel.traverse((child) => {
        if (child.isMesh && child.name.includes("Kitchen_Backsplash")) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    }
  });
}

function updateStoolsTexture() {
  const keys = Object.keys(stoolsTextureOptions);
  const selected = keys[currentIndices.stools];
  updateSelectionList();
  updateCurrentProductInfo("Stools", selected);
  textureLoader.load(stoolsTextureOptions[selected], (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (kitchenModel) {
      kitchenModel.traverse((child) => {
        if (child.isMesh && child.name.includes("Kitchen_Stools")) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    }
  });
}

function updateWallColor() {
  const keys = Object.keys(wallColorOptions);
  const selected = keys[currentIndices.wall];
  updateSelectionList();
  updateCurrentProductInfo("Wall Colour", selected);
  if (targetMaterial) {
    targetMaterial.color.set(wallColorOptions[selected]);
    targetMaterial.needsUpdate = true;
  }
}

// ------------------
// Selection Wrapper ("Selections" dropdown over canvas)
// ------------------
function createSelectionWrapper() {
  const selectionWrapper = document.createElement("div");
  selectionWrapper.id = "selection-wrapper";
  selectionWrapper.style.position = "absolute";
  selectionWrapper.style.top = "20px";
  selectionWrapper.style.left = "20px";
  selectionWrapper.style.zIndex = "5";
  selectionWrapper.style.display = "flex";
  selectionWrapper.style.flexDirection = "column";

  const innerContainer = document.createElement("div");
  innerContainer.style.position = "relative";

  const selectionToggle = document.createElement("button");
  selectionToggle.id = "selection-toggle";
  selectionToggle.textContent = "Selections ▼";
  selectionToggle.style.position = "relative";
  selectionToggle.style.zIndex = "2";
  selectionToggle.style.background = "#222";
  selectionToggle.style.color = "#fff";
  selectionToggle.style.border = "none";
  selectionToggle.style.cursor = "pointer";
  selectionToggle.style.padding = "6px 14px";
  selectionToggle.style.fontFamily = "Poppins, sans-serif";
  selectionToggle.style.fontSize = "0.8rem";
  selectionToggle.style.borderRadius = "999px";

  const selectionList = document.createElement("div");
  selectionList.id = "selection-list";
  selectionList.style.width = "260px";
  selectionList.style.position = "absolute";
  selectionList.style.top = "calc(100% + 6px)";
  selectionList.style.left = "0";
  selectionList.style.display = "none";
  selectionList.style.padding = "10px 12px";
  selectionList.style.backgroundColor = "rgba(35, 35, 35, 0.95)";
  selectionList.style.color = "#fff";
  selectionList.style.fontFamily = "Poppins, sans-serif";
  selectionList.style.fontSize = "0.8rem";
  selectionList.style.zIndex = "1";
  selectionList.style.borderRadius = "12px";
  selectionList.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";

  selectionToggle.addEventListener("click", () => {
    if (selectionList.style.display === "none") {
      selectionList.style.display = "block";
      selectionToggle.textContent = "Selections ▲";
    } else {
      selectionList.style.display = "none";
      selectionToggle.textContent = "Selections ▼";
    }
  });

  innerContainer.appendChild(selectionToggle);
  innerContainer.appendChild(selectionList);
  selectionWrapper.appendChild(innerContainer);

  return selectionWrapper;
}

// ------------------
// Three.js setup
// ------------------
let scene, camera, renderer, controls;
let kitchenModel = null;
let targetMaterial = null;
const sizes = { width: window.innerWidth, height: window.innerHeight };

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    55,
    sizes.width / sizes.height,
    0.1,
    1500
  );
  camera.position.set(0, 2, 4);

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#kitchen-canvas"),
    antialias: true,
    alpha: true,
  });

  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 2.5;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  document.querySelector("#kitchen-canvas").style.background =
    "radial-gradient(circle, #aaa, #222)";

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.target.set(0, 0, 0);
  controls.update();
  controls.minAzimuthAngle = -Math.PI / 1.9;
  controls.maxAzimuthAngle = Math.PI / 12;
  controls.minPolarAngle = Math.PI / 2.5;
  controls.maxPolarAngle = (3 * Math.PI) / 10;
  controls.minDistance = 1;
  controls.maxDistance = 6;
  const minPanY = 0,
    maxPanY = 0.7,
    minPanX = 0,
    maxPanX = 0;
  controls.addEventListener("change", () => {
    controls.target.y = THREE.MathUtils.clamp(
      controls.target.y,
      minPanY,
      maxPanY
    );
    controls.target.x = THREE.MathUtils.clamp(
      controls.target.x,
      minPanX,
      maxPanX
    );
  });
}

function updateModelScale() {
  if (kitchenModel) {
    const width = window.innerWidth;
    let scale = 1;
    if (width < 600) {
      scale = 0.5;
    } else if (width < 900) {
      scale = 0.75;
    } else {
      scale = 1;
    }
    kitchenModel.scale.set(scale, scale, scale);
  }
}

const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureMap = {
  Kitchen: {
    Kitchen_Utensils: "/textures/Kitchen_Utensils_Bake_2.webp",
    Kitchen_Cupboards: "/textures/cupboardsFolder/Kitchen_Cupboards_Bake.webp",
    Kitchen_Backsplash: "/textures/backsplashFolder/metro-stone-bone.webp",
    Kitchen_Stools: "/textures/stoolsFolder/Kitchen_Stool_Bake.webp",
    Kitchen_Worktop: "/textures/worktopFolder/Kitchen_Worktop_Bake.webp",
    Kitchen_Floor: "/textures/floorFolder/Kitchen_Floor_Bake.webp",
    Kitchen_Walls: "/textures/Kitchen_Wall_Bake_2.webp",
  },
};
const loadedTextures = { Kitchen: {} };
Object.entries(textureMap.Kitchen).forEach(([key, path]) => {
  const tex = textureLoader.load(path);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.Kitchen[key] = tex;
});

function loadKitchenModel(onComplete) {
  gltfLoader.load(
    "/models/tt_kitchen_bake.glb",
    (glb) => {
      kitchenModel = glb.scene;
      kitchenModel.traverse((child) => {
        if (child.isMesh) {
          Object.entries(loadedTextures.Kitchen).forEach(([key, texture]) => {
            if (child.name.includes(key)) {
              const material = new THREE.MeshBasicMaterial({ map: texture });
              child.material = material;
              if (child.material.map) {
                child.material.map.minFilter = THREE.LinearFilter;
              }
              if (child.name.includes("Kitchen_Walls")) {
                targetMaterial = material;
              }
              // Capture cupboards material so we can tint it later
              if (child.name.includes("Kitchen_Cupboards")) {
                cupboardsMaterial = material;
              }
            }
          });
        }
      });
      scene.add(kitchenModel);
      updateModelScale();
      onComplete && onComplete();
    },
    (xhr) => {
      if (xhr.total) {
        const progress = (xhr.loaded / xhr.total) * 100;
        document.getElementById("loader-bar").style.width = progress + "%";
        document.getElementById("loader-text").textContent =
          `Loading Kitchen Model... ${Math.round(progress)}%`;
      }
    },
    (error) => {
      console.error("Error loading kitchen model:", error);
    }
  );
}

// ------------------
// UI: Overlay Layout
// ------------------
const kitchenLink = document.getElementById("open-kitchen");
const homepageSections = document.querySelectorAll("section");
let kitchenOverlay = document.getElementById("kitchen-overlay");
let kitchenInitialised = false;

if (!kitchenOverlay) {
  kitchenOverlay = document.createElement("div");
  kitchenOverlay.id = "kitchen-overlay";
  kitchenOverlay.style.position = "fixed";
  kitchenOverlay.style.inset = "0";
  kitchenOverlay.style.backgroundColor = "#f3f3f3";
  kitchenOverlay.style.zIndex = "100";
  kitchenOverlay.style.display = "none";
  kitchenOverlay.style.flexDirection = "column";
  kitchenOverlay.style.fontFamily = "Poppins, sans-serif";

  // ======== TOP BAR ========
  const header = document.createElement("div");
  header.id = "kitchen-header";
  header.style.height = "64px";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.padding = "0 16px";
  header.style.borderBottom = "1px solid #e5e5e5";
  header.style.backgroundColor = "#f5f5f5";
  header.style.justifyContent = "space-between";

  // left: Exit
  const headerLeft = document.createElement("div");
  headerLeft.style.display = "flex";
  headerLeft.style.alignItems = "center";

  const exitBtn = document.createElement("button");
  exitBtn.id = "close-kitchen";
  exitBtn.style.display = "inline-flex";
  exitBtn.style.alignItems = "center";
  exitBtn.style.gap = "6px";
  exitBtn.style.background = "none";
  exitBtn.style.border = "none";
  exitBtn.style.color = "#333";
  exitBtn.style.fontSize = "0.9rem";
  exitBtn.style.cursor = "pointer";
  exitBtn.style.fontWeight = "500";

  const exitX = document.createElement("span");
  exitX.textContent = "×";
  exitX.style.fontSize = "1.2rem";

  const exitLabel = document.createElement("span");
  exitLabel.textContent = "Exit";

  exitBtn.appendChild(exitX);
  exitBtn.appendChild(exitLabel);
  headerLeft.appendChild(exitBtn);

  // center: mobile element dropdown
  const headerCenter = document.createElement("div");
  headerCenter.style.flex = "1";
  headerCenter.style.display = "flex";
  headerCenter.style.justifyContent = "center";

  categorySelectMobile = document.createElement("select");
  categorySelectMobile.id = "category-select-mobile";
  categorySelectMobile.style.minWidth = "140px";
  categorySelectMobile.style.maxWidth = "220px";
  categorySelectMobile.style.textAlign = "center";
  categorySelectMobile.style.fontSize = "0.8rem";
  categorySelectMobile.style.padding = "6px 16px";
  categorySelectMobile.style.borderRadius = "999px";
  categorySelectMobile.style.border = "none";
  categorySelectMobile.style.backgroundColor = "#5c555b";
  categorySelectMobile.style.color = "#fff";
  categorySelectMobile.style.appearance = "none";

  Object.keys(categoryFunctions).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentCategory) opt.selected = true;
    categorySelectMobile.appendChild(opt);
  });
  categorySelectMobile.addEventListener("change", (e) =>
    onCategoryChange(e.target.value)
  );

  headerCenter.appendChild(categorySelectMobile);

  // right: simple menu dots
  const headerRight = document.createElement("div");
  const dotsBtn = document.createElement("button");
  dotsBtn.textContent = "⋮";
  dotsBtn.style.background = "none";
  dotsBtn.style.border = "none";
  dotsBtn.style.cursor = "default";
  dotsBtn.style.fontSize = "1.3rem";
  dotsBtn.style.color = "#555";
  headerRight.appendChild(dotsBtn);

  header.appendChild(headerLeft);
  header.appendChild(headerCenter);
  header.appendChild(headerRight);
  kitchenOverlay.appendChild(header);

  // ======== MAIN BODY (sidebar + canvas) ========
  const body = document.createElement("div");
  body.id = "kitchen-body";
  body.style.flex = "1";
  body.style.display = "flex";
  body.style.overflow = "hidden";

  // ----- LEFT PANEL (desktop) -----
  const leftPanel = document.createElement("div");
  leftPanel.id = "left-panel";
  leftPanel.style.width = "320px";
  leftPanel.style.minWidth = "280px";
  leftPanel.style.maxWidth = "360px";
  leftPanel.style.borderRight = "1px solid #e5e5e5";
  leftPanel.style.display = "flex";
  leftPanel.style.flexDirection = "column";
  leftPanel.style.backgroundColor = "#fafafa";

  // search (desktop)
  const searchRow = document.createElement("div");
  searchRow.style.display = "flex";
  searchRow.style.alignItems = "center";
  searchRow.style.padding = "10px 16px";
  searchRow.style.borderBottom = "1px solid #e5e5e5";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search tiles...";
  searchInput.style.flex = "1";
  searchInput.style.fontSize = "0.8rem";
  searchInput.style.padding = "6px 10px";
  searchInput.style.borderRadius = "999px";
  searchInput.style.border = "1px solid #d0d0d0";
  searchInput.style.outline = "none";

  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value || "";
    updateOptionsRow();
  });

  searchRow.appendChild(searchInput);
  leftPanel.appendChild(searchRow);

  // element select (desktop)
  const categorySelectWrapper = document.createElement("div");
  categorySelectWrapper.style.display = "flex";
  categorySelectWrapper.style.alignItems = "center";
  categorySelectWrapper.style.justifyContent = "space-between";
  categorySelectWrapper.style.padding = "8px 16px";
  categorySelectWrapper.style.borderBottom = "1px solid #e5e5e5";
  categorySelectWrapper.style.backgroundColor = "#ffffff";
  categorySelectWrapper.style.gap = "8px";

  const categoryLabel = document.createElement("span");
  categoryLabel.textContent = "Element";
  categoryLabel.style.fontSize = "0.8rem";
  categoryLabel.style.color = "#4b5563";

  categorySelectDesktop = document.createElement("select");
  categorySelectDesktop.id = "category-select-desktop";
  categorySelectDesktop.style.flex = "1";
  categorySelectDesktop.style.fontSize = "0.8rem";
  categorySelectDesktop.style.padding = "6px 10px";
  categorySelectDesktop.style.borderRadius = "999px";
  categorySelectDesktop.style.border = "1px solid #d1d5db";
  categorySelectDesktop.style.backgroundColor = "#f9fafb";
  categorySelectDesktop.style.outline = "none";
  categorySelectDesktop.style.cursor = "pointer";

  Object.keys(categoryFunctions).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentCategory) opt.selected = true;
    categorySelectDesktop.appendChild(opt);
  });
  categorySelectDesktop.addEventListener("change", (e) =>
    onCategoryChange(e.target.value)
  );

  categorySelectWrapper.appendChild(categoryLabel);
  categorySelectWrapper.appendChild(categorySelectDesktop);
  leftPanel.appendChild(categorySelectWrapper);

  // options list (desktop)
  const optionsContainerDesktop = document.createElement("div");
  optionsContainerDesktop.id = "options-container-desktop";
  optionsContainerDesktop.style.flex = "1";
  optionsContainerDesktop.style.overflowY = "auto";
  optionsContainerDesktop.style.padding = "10px 16px 16px 16px";
  optionsContainerDesktop.style.display = "flex";
  optionsContainerDesktop.style.flexDirection = "column";
  optionsContainerDesktop.style.gap = "10px";
  leftPanel.appendChild(optionsContainerDesktop);

  body.appendChild(leftPanel);

  // ----- MAIN VISUALISER -----
  const mainPanel = document.createElement("div");
  mainPanel.id = "kitchen-main-panel";
  mainPanel.style.flex = "1";
  mainPanel.style.position = "relative";
  mainPanel.style.display = "flex";
  mainPanel.style.alignItems = "stretch";
  mainPanel.style.justifyContent = "center";
  mainPanel.style.backgroundColor = "#e5e5e5";

  const kitchenCanvas = document.createElement("canvas");
  kitchenCanvas.id = "kitchen-canvas";
  kitchenCanvas.style.width = "100%";
  kitchenCanvas.style.height = "100%";
  kitchenCanvas.style.display = "block";
  kitchenCanvas.style.background = "radial-gradient(circle, #aaa, #222)";
  mainPanel.appendChild(kitchenCanvas);

  const selectionWrapper = createSelectionWrapper();
  mainPanel.appendChild(selectionWrapper);

  // ----- MOBILE BOTTOM SHEET -----
  const bottomSheet = document.createElement("div");
  bottomSheet.id = "mobile-bottom-sheet";
  bottomSheet.style.position = "absolute";
  bottomSheet.style.left = "0";
  bottomSheet.style.right = "0";
  bottomSheet.style.bottom = "0";
  bottomSheet.style.backgroundColor = "#f9fafb";
  bottomSheet.style.borderTopLeftRadius = "18px";
  bottomSheet.style.borderTopRightRadius = "18px";
  bottomSheet.style.boxShadow = "0 -8px 20px rgba(0,0,0,0.12)";
  bottomSheet.style.display = "none"; // shown via media query
  bottomSheet.style.flexDirection = "column";
  bottomSheet.style.padding = "8px 16px 12px 16px";
  bottomSheet.style.zIndex = "10";
  bottomSheet.style.transition = "transform 0.25s ease-out";

  // panel sizing: partly visible state shows handle + summary + thumbs
  const SHEET_HEIGHT = 400;
  const COLLAPSED_VISIBLE = 150; // amount of sheet visible when collapsed
  const COLLAPSED_OFFSET = SHEET_HEIGHT - COLLAPSED_VISIBLE;

  bottomSheet.style.height = SHEET_HEIGHT + "px";
  bottomSheet.style.transform = `translateY(${COLLAPSED_OFFSET}px)`;

  let sheetExpanded = false;

  // handle & chevron
  const handleArea = document.createElement("div");
  handleArea.style.display = "flex";
  handleArea.style.flexDirection = "column";
  handleArea.style.alignItems = "center";
  handleArea.style.gap = "6px";
  handleArea.style.marginBottom = "6px";
  handleArea.style.cursor = "pointer";

  const handleBar = document.createElement("div");
  handleBar.style.width = "52px";
  handleBar.style.height = "4px";
  handleBar.style.borderRadius = "999px";
  handleBar.style.backgroundColor = "#d4d4d8";

  const chevronIcon = document.createElement("span");
  chevronIcon.textContent = "▲";
  chevronIcon.style.fontSize = "0.75rem";
  chevronIcon.style.color = "#9ca3af";

  handleArea.appendChild(handleBar);
  handleArea.appendChild(chevronIcon);
  bottomSheet.appendChild(handleArea);

  function setSheetExpanded(expanded) {
    sheetExpanded = expanded;
    if (sheetExpanded) {
      bottomSheet.style.transform = "translateY(0)";
      chevronIcon.textContent = "▼";
      if (mobileExpandedArea) {
        mobileExpandedArea.style.display = "flex";
      }
    } else {
      bottomSheet.style.transform = `translateY(${COLLAPSED_OFFSET}px)`;
      chevronIcon.textContent = "▲";
      if (mobileExpandedArea) {
        mobileExpandedArea.style.display = "none";
      }
    }
  }

  function toggleSheet() {
    setSheetExpanded(!sheetExpanded);
  }

  // current product summary
  const summaryRow = document.createElement("div");
  summaryRow.style.display = "flex";
  summaryRow.style.alignItems = "center";
  summaryRow.style.gap = "10px";
  summaryRow.style.marginBottom = "8px";

  const summaryThumb = document.createElement("img");
  summaryThumb.id = "current-product-thumb";
  summaryThumb.style.width = "52px";
  summaryThumb.style.height = "52px";
  summaryThumb.style.borderRadius = "12px";
  summaryThumb.style.objectFit = "cover";
  summaryThumb.style.border = "1px solid #e5e7eb";
  summaryThumb.style.backgroundColor = "#ffffff";

  const summaryTextWrap = document.createElement("div");
  summaryTextWrap.style.display = "flex";
  summaryTextWrap.style.flexDirection = "column";
  summaryTextWrap.style.flex = "1";
  summaryTextWrap.style.minWidth = "0";

  const summaryTitle = document.createElement("p");
  summaryTitle.id = "current-product-title";
  summaryTitle.textContent = "-";
  summaryTitle.style.margin = "0";
  summaryTitle.style.fontSize = "0.9rem";
  summaryTitle.style.fontWeight = "600";

  const summarySubtitle = document.createElement("p");
  summarySubtitle.id = "current-product-subtitle";
  summarySubtitle.textContent = "";
  summarySubtitle.style.margin = "0";
  summarySubtitle.style.fontSize = "0.75rem";
  summarySubtitle.style.color = "#6b7280";

  const summaryLink = document.createElement("a");
  summaryLink.id = "current-product-link";
  summaryLink.textContent = "More product details →";
  summaryLink.href = "#";
  summaryLink.target = "_blank";
  summaryLink.style.marginTop = "2px";
  summaryLink.style.fontSize = "0.75rem";
  summaryLink.style.color = "#111827";
  summaryLink.style.textDecoration = "none";
  summaryLink.style.display = "none";

  summaryTextWrap.appendChild(summaryTitle);
  summaryTextWrap.appendChild(summarySubtitle);
  summaryTextWrap.appendChild(summaryLink);

  summaryRow.appendChild(summaryThumb);
  summaryRow.appendChild(summaryTextWrap);
  bottomSheet.appendChild(summaryRow);

  // horizontal thumbs strip with side chevrons
  const thumbStrip = document.createElement("div");
  thumbStrip.id = "thumb-strip";
  thumbStrip.style.position = "relative";
  thumbStrip.style.display = "flex";
  thumbStrip.style.alignItems = "center";
  thumbStrip.style.marginBottom = "6px";

  const thumbRow = document.createElement("div");
  thumbRow.id = "mobile-thumb-row";
  thumbRow.style.display = "flex";
  thumbRow.style.gap = "8px";
  thumbRow.style.overflowX = "auto";
  thumbRow.style.paddingBottom = "6px";
  thumbRow.style.webkitOverflowScrolling = "touch";
  thumbRow.style.scrollBehavior = "smooth";
  thumbRow.style.flex = "1";

  const leftChevronBtn = document.createElement("button");
  leftChevronBtn.textContent = "‹";
  leftChevronBtn.style.position = "absolute";
  leftChevronBtn.style.left = "-4px";
  leftChevronBtn.style.top = "50%";
  leftChevronBtn.style.transform = "translateY(-50%)";
  leftChevronBtn.style.width = "26px";
  leftChevronBtn.style.height = "26px";
  leftChevronBtn.style.borderRadius = "999px";
  leftChevronBtn.style.border = "none";
  leftChevronBtn.style.background = "rgba(0,0,0,0.25)";
  leftChevronBtn.style.color = "#fff";
  leftChevronBtn.style.display = "flex";
  leftChevronBtn.style.alignItems = "center";
  leftChevronBtn.style.justifyContent = "center";
  leftChevronBtn.style.backdropFilter = "blur(4px)";
  leftChevronBtn.style.cursor = "pointer";

  const rightChevronBtn = document.createElement("button");
  rightChevronBtn.textContent = "›";
  rightChevronBtn.style.position = "absolute";
  rightChevronBtn.style.right = "-4px";
  rightChevronBtn.style.top = "50%";
  rightChevronBtn.style.transform = "translateY(-50%)";
  rightChevronBtn.style.width = "26px";
  rightChevronBtn.style.height = "26px";
  rightChevronBtn.style.borderRadius = "999px";
  rightChevronBtn.style.border = "none";
  rightChevronBtn.style.background = "rgba(0,0,0,0.25)";
  rightChevronBtn.style.color = "#fff";
  rightChevronBtn.style.display = "flex";
  rightChevronBtn.style.alignItems = "center";
  rightChevronBtn.style.justifyContent = "center";
  rightChevronBtn.style.backdropFilter = "blur(4px)";
  rightChevronBtn.style.cursor = "pointer";

  leftChevronBtn.addEventListener("click", () => {
    thumbRow.scrollBy({ left: -120, behavior: "smooth" });
  });
  rightChevronBtn.addEventListener("click", () => {
    thumbRow.scrollBy({ left: 120, behavior: "smooth" });
  });

  thumbStrip.appendChild(thumbRow);
  thumbStrip.appendChild(leftChevronBtn);
  thumbStrip.appendChild(rightChevronBtn);
  bottomSheet.appendChild(thumbStrip);

  // expanded content (search + list)
  const mobileExpandedArea = document.createElement("div");
  mobileExpandedArea.id = "mobile-expanded-area";
  mobileExpandedArea.style.display = "none";
  mobileExpandedArea.style.flexDirection = "column";
  mobileExpandedArea.style.gap = "8px";
  mobileExpandedArea.style.flex = "1";

  // tap on handle expands/collapses
  handleArea.addEventListener("click", toggleSheet);

  // mobile search
  const mobileSearchRow = document.createElement("div");
  mobileSearchRow.style.display = "flex";
  mobileSearchRow.style.alignItems = "center";
  mobileSearchRow.style.padding = "0";

  const mobileSearchInput = document.createElement("input");
  mobileSearchInput.type = "text";
  mobileSearchInput.placeholder = "Search...";
  mobileSearchInput.style.flex = "1";
  mobileSearchInput.style.fontSize = "0.8rem";
  mobileSearchInput.style.padding = "6px 10px";
  mobileSearchInput.style.borderRadius = "999px";
  mobileSearchInput.style.border = "1px solid #d0d0d0";
  mobileSearchInput.style.outline = "none";

  mobileSearchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value || "";
    updateOptionsRow();
  });

  mobileSearchRow.appendChild(mobileSearchInput);
  mobileExpandedArea.appendChild(mobileSearchRow);

  // mobile list container
  const mobileOptionsContainer = document.createElement("div");
  mobileOptionsContainer.id = "options-container-mobile";
  mobileOptionsContainer.style.flex = "1";
  mobileOptionsContainer.style.overflowY = "auto";
  mobileOptionsContainer.style.display = "flex";
  mobileOptionsContainer.style.flexDirection = "column";
  mobileOptionsContainer.style.gap = "10px";
  mobileOptionsContainer.style.paddingTop = "4px";
  mobileOptionsContainer.style.webkitOverflowScrolling = "touch";
  mobileExpandedArea.appendChild(mobileOptionsContainer);

  // mobile brand
  const mobileBrand = document.createElement("div");
  mobileBrand.textContent = "Powered by Plan Vector";
  mobileBrand.style.textAlign = "right";
  mobileBrand.style.fontSize = "0.7rem";
  mobileBrand.style.color = "#9ca3af";
  mobileBrand.style.marginTop = "4px";
  mobileExpandedArea.appendChild(mobileBrand);

  bottomSheet.appendChild(mobileExpandedArea);
  mainPanel.appendChild(bottomSheet);

  body.appendChild(mainPanel);
  kitchenOverlay.appendChild(body);

  // ======== BOTTOM BAR (desktop) ========
  const bottomBar = document.createElement("div");
  bottomBar.id = "kitchen-bottom-bar";
  bottomBar.style.height = "64px";
  bottomBar.style.borderTop = "1px solid #e5e5e5";
  bottomBar.style.backgroundColor = "#f9fafb";
  bottomBar.style.display = "flex";
  bottomBar.style.alignItems = "center";
  bottomBar.style.justifyContent = "space-between";
  bottomBar.style.padding = "0 24px";
  bottomBar.style.fontSize = "0.85rem";

  const currentText = document.createElement("div");
  currentText.style.display = "flex";
  currentText.style.alignItems = "center";
  currentText.style.gap = "6px";

  const currentLabel = document.createElement("span");
  currentLabel.textContent = "Current selection:";

  const currentPlaceholder = document.createElement("span");
  currentPlaceholder.id = "option-placeholder";
  currentPlaceholder.style.fontWeight = "600";
  currentPlaceholder.textContent = "-";

  currentText.appendChild(currentLabel);
  currentText.appendChild(currentPlaceholder);

  const poweredBy = document.createElement("div");
  poweredBy.innerHTML =
    'Powered by <span style="font-weight:600;">Plan Vector</span>';
  poweredBy.style.color = "#6b7280";
  poweredBy.style.fontSize = "0.8rem";

  bottomBar.appendChild(currentText);
  bottomBar.appendChild(poweredBy);
  kitchenOverlay.appendChild(bottomBar);

  // ======== LOADER OVERLAY ========
  const loaderDiv = document.createElement("div");
  loaderDiv.id = "loader";
  loaderDiv.style.position = "absolute";
  loaderDiv.style.inset = "0";
  loaderDiv.style.backgroundColor = "rgba(255,255,255,0.9)";
  loaderDiv.style.display = "flex";
  loaderDiv.style.flexDirection = "column";
  loaderDiv.style.alignItems = "center";
  loaderDiv.style.justifyContent = "center";
  loaderDiv.style.zIndex = "110";

  const loaderBar = document.createElement("div");
  loaderBar.id = "loader-bar";
  loaderBar.style.width = "0%";
  loaderBar.style.height = "4px";
  loaderBar.style.backgroundColor = "#111827";
  loaderBar.style.marginBottom = "10px";

  const loaderText = document.createElement("p");
  loaderText.id = "loader-text";
  loaderText.textContent = "Loading Kitchen Model...";
  loaderText.style.fontSize = "0.9rem";
  loaderText.style.color = "#111827";

  loaderDiv.appendChild(loaderBar);
  loaderDiv.appendChild(loaderText);
  kitchenOverlay.appendChild(loaderDiv);

  document.body.appendChild(kitchenOverlay);

  // Exit behaviour
  exitBtn.addEventListener("click", () => {
    kitchenOverlay.style.display = "none";
    homepageSections.forEach((sec) => {
      sec.style.display = "";
    });
  });
}

// Open from landing page button
if (kitchenLink) {
  kitchenLink.addEventListener("click", (e) => {
    e.preventDefault();
    homepageSections.forEach((sec) => {
      sec.style.display = "none";
    });
    kitchenOverlay.style.display = "flex";

    if (!kitchenInitialised) {
      initThree();
      loadKitchenModel(() => {
        const loader = document.getElementById("loader");
        if (loader) loader.style.display = "none";
        categoryFunctions[currentCategory].update();
        updateOptionsRow();
      });
      kitchenInitialised = true;
    }
  });
} else {
  console.warn("Kitchen visualiser button #open-kitchen not found.");
}

// ------------------
// Render Loop
// ------------------
function render() {
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  requestAnimationFrame(render);
}
render();

// ------------------
// Raycaster & Resize
// ------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateModelScale();
});
