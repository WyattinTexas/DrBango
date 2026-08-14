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
    endWin: 'THE SKY IS QUIET', endWinSub: 'every star-beast has fallen · the night is yours',
    endLose: 'THE STARS CLAIM YOU', endLoseSub: 'the ascent ends here',
    stScore: 'score', stBest: 'best %1', newBest: '✦ NEW BEST ✦',
    stBeasts: 'beasts felled', stWords: 'words woven', stLetters: 'letters cast',
    stFinest: 'finest word', stBigHit: 'mightiest hit', stTime: 'run time', stSigils: 'sigils held',
    newRun: 'NEW RUN', tryAgain: 'TRY AGAIN', home: 'HOME',
    shareBtn: '✶ SHARE TODAY\'S HUNT', shareCopied: '✶ COPIED — GO BOAST', shareFail: '✶ COPY FAILED',
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
    endWin: 'EL CIELO CALLA', endWinSub: 'todas las bestias estelares han caído · la noche es tuya',
    endLose: 'LAS ESTRELLAS TE RECLAMAN', endLoseSub: 'el ascenso termina aquí',
    stScore: 'puntos', stBest: 'récord %1', newBest: '✦ ¡NUEVO RÉCORD! ✦',
    stBeasts: 'bestias derribadas', stWords: 'palabras tejidas', stLetters: 'letras lanzadas',
    stFinest: 'mejor palabra', stBigHit: 'golpe supremo', stTime: 'duración', stSigils: 'sigilos',
    newRun: 'NUEVA PARTIDA', tryAgain: 'REINTENTAR', home: 'INICIO',
    shareBtn: '✶ COMPARTIR LA CAZA', shareCopied: '✶ COPIADO — A PRESUMIR', shareFail: '✶ ERROR AL COPIAR',
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
    endWin: 'LE CIEL SE TAIT', endWinSub: 'toutes les bêtes stellaires sont tombées · la nuit est à toi',
    endLose: 'LES ÉTOILES TE RÉCLAMENT', endLoseSub: 'l’ascension s’arrête ici',
    stScore: 'score', stBest: 'record %1', newBest: '✦ NOUVEAU RECORD ! ✦',
    stBeasts: 'bêtes terrassées', stWords: 'mots tissés', stLetters: 'lettres lancées',
    stFinest: 'plus beau mot', stBigHit: 'coup suprême', stTime: 'durée', stSigils: 'sceaux',
    newRun: 'NOUVELLE PARTIE', tryAgain: 'RÉESSAYER', home: 'ACCUEIL',
    shareBtn: '✶ PARTAGER LA CHASSE', shareCopied: '✶ COPIÉ — VA FRIMER', shareFail: '✶ ÉCHEC DE LA COPIE',
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
    endWin: 'O CÉU SILENCIA', endWinSub: 'todas as feras estelares caíram · a noite é sua',
    endLose: 'AS ESTRELAS TE RECLAMAM', endLoseSub: 'a subida termina aqui',
    stScore: 'pontos', stBest: 'recorde %1', newBest: '✦ NOVO RECORDE! ✦',
    stBeasts: 'feras derrubadas', stWords: 'palavras tecidas', stLetters: 'letras lançadas',
    stFinest: 'melhor palavra', stBigHit: 'golpe supremo', stTime: 'duração', stSigils: 'sígilos',
    newRun: 'NOVA PARTIDA', tryAgain: 'TENTAR DE NOVO', home: 'INÍCIO',
    shareBtn: '✶ COMPARTILHAR A CAÇADA', shareCopied: '✶ COPIADO — VÁ SE GABAR', shareFail: '✶ FALHA AO COPIAR',
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
    endWin: 'DER HIMMEL SCHWEIGT', endWinSub: 'alle Sternenbestien sind gefallen · die Nacht gehört dir',
    endLose: 'DIE STERNE HOLEN DICH', endLoseSub: 'der Aufstieg endet hier',
    stScore: 'Punkte', stBest: 'Rekord %1', newBest: '✦ NEUER REKORD! ✦',
    stBeasts: 'Bestien gefällt', stWords: 'Worte gewoben', stLetters: 'Buchstaben gewirkt',
    stFinest: 'schönstes Wort', stBigHit: 'stärkster Treffer', stTime: 'Laufzeit', stSigils: 'Sigel',
    newRun: 'NEUER LAUF', tryAgain: 'NOCHMAL', home: 'START',
    shareBtn: '✶ JAGD TEILEN', shareCopied: '✶ KOPIERT — GEH PRAHLEN', shareFail: '✶ KOPIEREN FEHLGESCHLAGEN',
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
    endWin: '空は静まった', endWinSub: '星獣はすべて討たれた · 今夜は君のもの',
    endLose: '星々が君を連れ去る', endLoseSub: '昇りはここで終わる',
    stScore: 'スコア', stBest: '自己ベスト %1', newBest: '✦ 新記録! ✦',
    stBeasts: '討った星獣', stWords: '紡いだ言葉', stLetters: '放った文字',
    stFinest: '最高の言葉', stBigHit: '最大の一撃', stTime: 'プレイ時間', stSigils: '所持シジル',
    newRun: 'もう一度', tryAgain: '再挑戦', home: 'ホーム',
    shareBtn: '✶ 今日の狩りをシェア', shareCopied: '✶ コピーした · 自慢しよう', shareFail: '✶ コピー失敗',
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
    endWin: '하늘이 고요해졌다', endWinSub: '별짐승을 모두 쓰러뜨렸다 · 이 밤은 너의 것',
    endLose: '별들이 너를 삼켰다', endLoseSub: '승천은 여기서 끝난다',
    stScore: '점수', stBest: '최고 기록 %1', newBest: '✦ 신기록! ✦',
    stBeasts: '쓰러뜨린 짐승', stWords: '엮은 단어', stLetters: '쓴 글자',
    stFinest: '최고의 단어', stBigHit: '최대 일격', stTime: '플레이 시간', stSigils: '인장',
    newRun: '새 도전', tryAgain: '재도전', home: '홈',
    shareBtn: '✶ 오늘의 사냥 공유', shareCopied: '✶ 복사 완료 · 자랑하세요', shareFail: '✶ 복사 실패',
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
    endWin: '星空归于寂静', endWinSub: '星兽尽数陨落 · 今夜属于你',
    endLose: '星辰将你收回', endLoseSub: '攀升到此为止',
    stScore: '得分', stBest: '最佳 %1', newBest: '✦ 新纪录! ✦',
    stBeasts: '击落星兽', stWords: '编织词语', stLetters: '施放字母',
    stFinest: '最佳词语', stBigHit: '最强一击', stTime: '用时', stSigils: '持有印记',
    newRun: '再来一局', tryAgain: '重新挑战', home: '主页',
    shareBtn: '✶ 分享今日狩猎', shareCopied: '✶ 已复制 · 去炫耀吧', shareFail: '✶ 复制失败',
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
    endWin: 'आकाश शांत है', endWinSub: 'सारे तारा-दानव गिर चुके · यह रात तुम्हारी है',
    endLose: 'तारों ने तुम्हें ले लिया', endLoseSub: 'चढ़ाई यहीं समाप्त होती है',
    stScore: 'स्कोर', stBest: 'सर्वश्रेष्ठ %1', newBest: '✦ नया रिकॉर्ड! ✦',
    stBeasts: 'दानव हराए', stWords: 'शब्द बुने', stLetters: 'अक्षर चले',
    stFinest: 'श्रेष्ठ शब्द', stBigHit: 'सबसे बड़ा वार', stTime: 'खेल अवधि', stSigils: 'मुद्राएँ',
    newRun: 'नया खेल', tryAgain: 'फिर से', home: 'होम',
    shareBtn: '✶ आज का शिकार साझा करें', shareCopied: '✶ कॉपी हो गया · शेखी बघारें', shareFail: '✶ कॉपी विफल',
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
    endWin: 'سكنت السماء', endWinSub: 'سقطت كل وحوش النجوم · الليل لك',
    endLose: 'النجوم تستردّك', endLoseSub: 'ينتهي الصعود هنا',
    stScore: 'النقاط', stBest: 'الأفضل %1', newBest: '✦ رقم قياسي جديد! ✦',
    stBeasts: 'وحوش صُرعت', stWords: 'كلمات نُسجت', stLetters: 'حروف أُلقيت',
    stFinest: 'أجمل كلمة', stBigHit: 'أقوى ضربة', stTime: 'مدة الجولة', stSigils: 'الأختام',
    newRun: 'جولة جديدة', tryAgain: 'حاول مجددًا', home: 'الرئيسية',
    shareBtn: '✶ شارك صيد اليوم', shareCopied: '✶ تم النسخ · تباهَ به', shareFail: '✶ فشل النسخ',
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
