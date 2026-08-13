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
    rotate: 'turn your phone upright to play',
    title: 'STARSPELL',
    tagline: 'weave words · fell the star-beasts',
    campaign: 'CAMPAIGN', campaignSub: 'three acts · one long night',
    cont: 'CONTINUE', fightN: 'fight %1 of 5',
    quick: 'QUICK PLAY', quickSub: 'five beasts, then the Star Eater',
    daily: 'DAILY HUNT', dailyOpen: 'one sky, shared by all · %1 left',
    dailyDone: 'today: %1 · next sky in %2', cdHM: '%1h %2m', cdH: '%1h', cdM: '%1m',
    board: 'LEADERBOARD', profile: 'PROFILE',
    versus: '⚔ VERSUS ⚔', versusSub: 'duel beneath the stars',
  },
  es: {
    rotate: 'gira el teléfono en vertical para jugar',
    title: 'STARSPELL',
    tagline: 'teje palabras · derriba a las bestias estelares',
    campaign: 'CAMPAÑA', campaignSub: 'tres actos · una larga noche',
    cont: 'CONTINUAR', fightN: 'combate %1 de 5',
    quick: 'PARTIDA RÁPIDA', quickSub: 'cinco bestias, y luego el Devorador de Estrellas',
    daily: 'CAZA DIARIA', dailyOpen: 'un mismo cielo para todos · quedan %1',
    dailyDone: 'hoy: %1 · nuevo cielo en %2', cdHM: '%1 h %2 min', cdH: '%1 h', cdM: '%1 min',
    board: 'CLASIFICACIÓN', profile: 'PERFIL',
    versus: '⚔ VERSUS ⚔', versusSub: 'duelo bajo las estrellas',
  },
  fr: {
    rotate: 'tourne ton téléphone à la verticale pour jouer',
    title: 'STARSPELL',
    tagline: 'tisse des mots · terrasse les bêtes stellaires',
    campaign: 'CAMPAGNE', campaignSub: 'trois actes · une longue nuit',
    cont: 'CONTINUER', fightN: 'combat %1 sur 5',
    quick: 'PARTIE RAPIDE', quickSub: 'cinq bêtes, puis le Dévoreur d’Étoiles',
    daily: 'CHASSE DU JOUR', dailyOpen: 'un même ciel, partagé par tous · %1 restant',
    dailyDone: 'aujourd’hui : %1 · prochain ciel dans %2', cdHM: '%1 h %2 min', cdH: '%1 h', cdM: '%1 min',
    board: 'CLASSEMENT', profile: 'PROFIL',
    versus: '⚔ VERSUS ⚔', versusSub: 'duel sous les étoiles',
  },
  pt: {
    rotate: 'gire o celular na vertical para jogar',
    title: 'STARSPELL',
    tagline: 'teça palavras · derrube as feras estelares',
    campaign: 'CAMPANHA', campaignSub: 'três atos · uma longa noite',
    cont: 'CONTINUAR', fightN: 'luta %1 de 5',
    quick: 'JOGO RÁPIDO', quickSub: 'cinco feras, depois o Devorador de Estrelas',
    daily: 'CAÇADA DIÁRIA', dailyOpen: 'um só céu, de todos · faltam %1',
    dailyDone: 'hoje: %1 · novo céu em %2', cdHM: '%1 h %2 min', cdH: '%1 h', cdM: '%1 min',
    board: 'PLACAR', profile: 'PERFIL',
    versus: '⚔ VERSUS ⚔', versusSub: 'duelo sob as estrelas',
  },
  de: {
    rotate: 'dreh dein Handy ins Hochformat, um zu spielen',
    title: 'STARSPELL',
    tagline: 'webe Worte · fälle die Sternenbestien',
    campaign: 'KAMPAGNE', campaignSub: 'drei Akte · eine lange Nacht',
    cont: 'WEITER', fightN: 'Kampf %1 von 5',
    quick: 'SCHNELLES SPIEL', quickSub: 'fünf Bestien, dann der Sternenfresser',
    daily: 'TAGESJAGD', dailyOpen: 'ein Himmel, geteilt mit allen · noch %1',
    dailyDone: 'heute: %1 · neuer Himmel in %2', cdHM: '%1 Std %2 Min', cdH: '%1 Std', cdM: '%1 Min',
    board: 'BESTENLISTE', profile: 'PROFIL',
    versus: '⚔ VERSUS ⚔', versusSub: 'Duell unter Sternen',
  },
  ja: {
    rotate: 'タテ画面にして遊んでね',
    title: 'STARSPELL',
    tagline: '言葉を紡ぎ、星獣を討て',
    campaign: 'キャンペーン', campaignSub: '三幕・長き一夜',
    cont: 'つづきから', fightN: '戦い %1 / 5',
    quick: 'クイックプレイ', quickSub: '五体の獣、そして星喰い',
    daily: 'デイリーハント', dailyOpen: 'ひとつの空を、みんなで · 残り%1',
    dailyDone: '今日: %1 · 次の空まで%2', cdHM: '%1時間%2分', cdH: '%1時間', cdM: '%1分',
    board: 'ランキング', profile: 'プロフィール',
    versus: '⚔ VS ⚔', versusSub: '星空の下の決闘',
  },
  ko: {
    rotate: '세로 화면으로 돌려서 플레이하세요',
    title: 'STARSPELL',
    tagline: '단어를 엮어 별짐승을 쓰러뜨려라',
    campaign: '캠페인', campaignSub: '3막 · 기나긴 하룻밤',
    cont: '이어하기', fightN: '전투 %1 / 5',
    quick: '빠른 대전', quickSub: '다섯 짐승, 그리고 별포식자',
    daily: '오늘의 사냥', dailyOpen: '모두가 함께 보는 하나의 하늘 · %1 남음',
    dailyDone: '오늘: %1 · 다음 하늘까지 %2', cdHM: '%1시간 %2분', cdH: '%1시간', cdM: '%1분',
    board: '리더보드', profile: '프로필',
    versus: '⚔ VS ⚔', versusSub: '별빛 아래 결투',
  },
  zh: {
    rotate: '请竖屏游玩',
    title: 'STARSPELL',
    tagline: '编织词语 · 击落星兽',
    campaign: '战役', campaignSub: '三幕 · 一整夜',
    cont: '继续', fightN: '第 %1 战，共 5 战',
    quick: '快速游戏', quickSub: '五头星兽，然后是食星者',
    daily: '每日狩猎', dailyOpen: '同一片星空，人人共享 · 剩余%1',
    dailyDone: '今日: %1 · 距下一片星空%2', cdHM: '%1小时%2分', cdH: '%1小时', cdM: '%1分',
    board: '排行榜', profile: '个人资料',
    versus: '⚔ 对战 ⚔', versusSub: '星空下的决斗',
  },
  hi: {
    rotate: 'खेलने के लिए फ़ोन को सीधा करें',
    title: 'STARSPELL',
    tagline: 'शब्द बुनो · तारा-दानवों को हराओ',
    campaign: 'अभियान', campaignSub: 'तीन अंक · एक लंबी रात',
    cont: 'जारी रखें', fightN: 'लड़ाई %1 / 5',
    quick: 'त्वरित खेल', quickSub: 'पाँच दानव, फिर तारा-भक्षक',
    daily: 'दैनिक शिकार', dailyOpen: 'एक आकाश, सबका साझा · %1 शेष',
    dailyDone: 'आज: %1 · अगला आकाश %2 में', cdHM: '%1 घं %2 मि', cdH: '%1 घं', cdM: '%1 मि',
    board: 'लीडरबोर्ड', profile: 'प्रोफ़ाइल',
    versus: '⚔ वर्सस ⚔', versusSub: 'तारों तले द्वंद्व',
  },
  ar: {
    rotate: 'أدر هاتفك عموديًا للعب',
    title: 'STARSPELL',
    tagline: 'انسج الكلمات · واصرع وحوش النجوم',
    campaign: 'الحملة', campaignSub: 'ثلاثة فصول · ليلة واحدة طويلة',
    cont: 'متابعة', fightN: 'المعركة %1 من 5',
    quick: 'لعب سريع', quickSub: 'خمسة وحوش، ثم آكل النجوم',
    daily: 'صيد اليوم', dailyOpen: 'سماء واحدة يتشاركها الجميع · يتبقى %1',
    dailyDone: 'اليوم: %1 · السماء التالية بعد %2', cdHM: '%1 س %2 د', cdH: '%1 س', cdM: '%1 د',
    board: 'لوحة الصدارة', profile: 'الملف الشخصي',
    versus: '⚔ مبارزة ⚔', versusSub: 'تحت النجوم',
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
