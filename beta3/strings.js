'use strict';
/* ============================================================
   STARSPELL i18n — the strings table.
   Pick order: ?lang=xx → saved pref → browser language → en.
   ?lang also SAVES, so a player who follows a ?lang=es link
   stays in Spanish. Keys fall back to English per-string, so a
   partially translated language ships gracefully.
   Home screen is wired through SS_T(); battle/versus/profile
   strings migrate here incrementally.
   ============================================================ */
const SS_STR = {
  en: {
    title: 'STARSPELL',
    tagline: 'weave words · fell the star-beasts',
    campaign: 'CAMPAIGN', campaignSub: 'three acts · one long night',
    cont: 'CONTINUE', fightN: 'fight %1 of 5',
    quick: 'QUICK PLAY', quickSub: 'five beasts, then the Star Eater',
    daily: 'DAILY HUNT', dailySub: 'one sky, shared by all', dailyAgain: 'today: %1 — again for glory',
    board: 'LEADERBOARD', profile: 'PROFILE',
    versus: '⚔  VERSUS — duel beneath the stars  ⚔',
  },
  es: {
    title: 'STARSPELL',
    tagline: 'teje palabras · derriba a las bestias estelares',
    campaign: 'CAMPAÑA', campaignSub: 'tres actos · una larga noche',
    cont: 'CONTINUAR', fightN: 'combate %1 de 5',
    quick: 'PARTIDA RÁPIDA', quickSub: 'cinco bestias, y luego el Devorador de Estrellas',
    daily: 'CAZA DIARIA', dailySub: 'un mismo cielo para todos', dailyAgain: 'hoy: %1 — otra vez por la gloria',
    board: 'CLASIFICACIÓN', profile: 'PERFIL',
    versus: '⚔  VERSUS — duelo bajo las estrellas  ⚔',
  },
  fr: {
    title: 'STARSPELL',
    tagline: 'tisse des mots · terrasse les bêtes stellaires',
    campaign: 'CAMPAGNE', campaignSub: 'trois actes · une longue nuit',
    cont: 'CONTINUER', fightN: 'combat %1 sur 5',
    quick: 'PARTIE RAPIDE', quickSub: 'cinq bêtes, puis le Dévoreur d’Étoiles',
    daily: 'CHASSE DU JOUR', dailySub: 'un même ciel, partagé par tous', dailyAgain: 'aujourd’hui : %1 — encore pour la gloire',
    board: 'CLASSEMENT', profile: 'PROFIL',
    versus: '⚔  VERSUS — duel sous les étoiles  ⚔',
  },
  pt: {
    title: 'STARSPELL',
    tagline: 'teça palavras · derrube as feras estelares',
    campaign: 'CAMPANHA', campaignSub: 'três atos · uma longa noite',
    cont: 'CONTINUAR', fightN: 'luta %1 de 5',
    quick: 'JOGO RÁPIDO', quickSub: 'cinco feras, depois o Devorador de Estrelas',
    daily: 'CAÇADA DIÁRIA', dailySub: 'um só céu, de todos', dailyAgain: 'hoje: %1 — de novo pela glória',
    board: 'PLACAR', profile: 'PERFIL',
    versus: '⚔  VERSUS — duelo sob as estrelas  ⚔',
  },
  de: {
    title: 'STARSPELL',
    tagline: 'webe Worte · fälle die Sternenbestien',
    campaign: 'KAMPAGNE', campaignSub: 'drei Akte · eine lange Nacht',
    cont: 'WEITER', fightN: 'Kampf %1 von 5',
    quick: 'SCHNELLES SPIEL', quickSub: 'fünf Bestien, dann der Sternenfresser',
    daily: 'TAGESJAGD', dailySub: 'ein Himmel, geteilt mit allen', dailyAgain: 'heute: %1 — noch einmal für den Ruhm',
    board: 'BESTENLISTE', profile: 'PROFIL',
    versus: '⚔  VERSUS — Duell unter Sternen  ⚔',
  },
  ja: {
    title: 'STARSPELL',
    tagline: '言葉を紡ぎ、星獣を討て',
    campaign: 'キャンペーン', campaignSub: '三幕・長き一夜',
    cont: 'つづきから', fightN: '戦い %1 / 5',
    quick: 'クイックプレイ', quickSub: '五体の獣、そして星喰い',
    daily: 'デイリーハント', dailySub: 'ひとつの空を、みんなで', dailyAgain: '今日: %1 — 栄光をもう一度',
    board: 'ランキング', profile: 'プロフィール',
    versus: '⚔  VS — 星空の下の決闘  ⚔',
  },
  ko: {
    title: 'STARSPELL',
    tagline: '단어를 엮어 별짐승을 쓰러뜨려라',
    campaign: '캠페인', campaignSub: '3막 · 기나긴 하룻밤',
    cont: '이어하기', fightN: '전투 %1 / 5',
    quick: '빠른 대전', quickSub: '다섯 짐승, 그리고 별포식자',
    daily: '오늘의 사냥', dailySub: '모두가 함께 보는 하나의 하늘', dailyAgain: '오늘: %1 — 다시 한번 영광을',
    board: '리더보드', profile: '프로필',
    versus: '⚔  VS — 별빛 아래 결투  ⚔',
  },
  zh: {
    title: 'STARSPELL',
    tagline: '编织词语 · 击落星兽',
    campaign: '战役', campaignSub: '三幕 · 一整夜',
    cont: '继续', fightN: '第 %1 战，共 5 战',
    quick: '快速游戏', quickSub: '五头星兽，然后是食星者',
    daily: '每日狩猎', dailySub: '同一片星空，人人共享', dailyAgain: '今日: %1 — 为荣耀再战一次',
    board: '排行榜', profile: '个人资料',
    versus: '⚔  对战 — 星空下的决斗  ⚔',
  },
  hi: {
    title: 'STARSPELL',
    tagline: 'शब्द बुनो · तारा-दानवों को हराओ',
    campaign: 'अभियान', campaignSub: 'तीन अंक · एक लंबी रात',
    cont: 'जारी रखें', fightN: 'लड़ाई %1 / 5',
    quick: 'त्वरित खेल', quickSub: 'पाँच दानव, फिर तारा-भक्षक',
    daily: 'दैनिक शिकार', dailySub: 'एक आकाश, सबका साझा', dailyAgain: 'आज: %1 — फिर से गौरव के लिए',
    board: 'लीडरबोर्ड', profile: 'प्रोफ़ाइल',
    versus: '⚔  वर्सस — तारों तले द्वंद्व  ⚔',
  },
  ar: {
    title: 'STARSPELL',
    tagline: 'انسج الكلمات · واصرع وحوش النجوم',
    campaign: 'الحملة', campaignSub: 'ثلاثة فصول · ليلة واحدة طويلة',
    cont: 'متابعة', fightN: 'المعركة %1 من 5',
    quick: 'لعب سريع', quickSub: 'خمسة وحوش، ثم آكل النجوم',
    daily: 'صيد اليوم', dailySub: 'سماء واحدة يتشاركها الجميع', dailyAgain: 'اليوم: %1 — مرة أخرى من أجل المجد',
    board: 'لوحة الصدارة', profile: 'الملف الشخصي',
    versus: '⚔  مبارزة تحت النجوم  ⚔',
  },
};

// native names, for the language sheet — never translated
const SS_LANGS = {
  en: 'English', es: 'Español', fr: 'Français', pt: 'Português', de: 'Deutsch',
  ja: '日本語', ko: '한국어', zh: '中文', hi: 'हिन्दी', ar: 'العربية',
};

const SS_LANG = (() => {
  const qs = new URLSearchParams(location.search);
  const q = (qs.get('lang') || '').toLowerCase();
  if (SS_STR[q]) { try { localStorage.setItem('beta3.lang', q); } catch (e) { } return q; }
  let saved = null;
  try { saved = localStorage.getItem('beta3.lang'); } catch (e) { }
  if (SS_STR[saved]) return saved;
  const nav = ((navigator.language || 'en').slice(0, 2)).toLowerCase();
  return SS_STR[nav] ? nav : 'en';
})();

function SS_T(key) {
  let s = (SS_STR[SS_LANG] && SS_STR[SS_LANG][key]) || SS_STR.en[key] || key;
  for (let i = 1; i < arguments.length; i++) s = s.replace('%' + i, arguments[i]);
  return s;
}

try { document.title = SS_T('title'); } catch (e) { }
