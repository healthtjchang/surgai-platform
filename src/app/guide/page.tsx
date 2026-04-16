'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

const SECTIONS = [
  { id: 'overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { id: 'player', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { id: 'ai', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'tools', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'correct', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'session', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'glossary', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
  { id: 'faq', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

interface GuideContent {
  title: string;
  subtitle: string;
  steps?: Array<{ title: string; desc: string; tip?: string }>;
  features?: Array<{ title: string; desc: string }>;
  notes?: string[];
}

function getContent(id: string, isEn: boolean): GuideContent {
  const content: Record<string, { zh: GuideContent; en: GuideContent }> = {
    overview: {
      zh: {
        title: '平台總覽',
        subtitle: 'SurgAI 是一個 AI 驅動的手術影像記錄與學習平台，讓每一台手術自動成為高品質教學資源。',
        features: [
          { title: '影片上傳與 AI 處理', desc: '上傳手術影片後，AI 自動完成語音轉文字、章節分段、教案生成。' },
          { title: 'AI 教學問答', desc: '學員可對影片內容即時提問，AI 根據逐字稿和教案精準回答。' },
          { title: '教案製作工具', desc: '一鍵生成測驗題、學習重點、臨床 Tips、安全清單。匯出 SRT 字幕或 Markdown 教案。' },
          { title: '逐字稿校正', desc: '點擊即可編輯逐字稿，系統自動學習口音模式，支援批次校正。' },
          { title: '多鏡頭同步播放', desc: '整合 AI 眼鏡、腹腔鏡、顯微鏡等多來源影像，同步播放。' },
          { title: '手術知識庫', desc: '14 專科、6 標準術式，含步驟、器械、解剖結構中英對照。' },
          { title: '醫學術語對照表', desc: '44 個內建術語 + 自訂術語，提升 AI 轉譯準確度。' },
          { title: '中英雙語', desc: '全平台支援繁體中文和英文即時切換。' },
        ],
        notes: ['Demo 帳號：surgeon@demo.com / demo123', '無需 API Key 即可使用 demo 模式', '支援 PWA，可從手機瀏覽器「加入主畫面」'],
      },
      en: {
        title: 'Platform Overview',
        subtitle: 'SurgAI is an AI-powered surgical video recording and learning platform that turns every surgery into a high-quality teaching resource.',
        features: [
          { title: 'Video Upload & AI Processing', desc: 'Upload surgical video, AI auto-transcribes, segments chapters, generates teaching materials.' },
          { title: 'AI Teaching Q&A', desc: 'Trainees ask questions about video content, AI answers based on transcript and teaching materials.' },
          { title: 'Teaching Tools', desc: 'One-click generate quizzes, key points, clinical pearls, safety checklists. Export SRT or Markdown.' },
          { title: 'Transcript Correction', desc: 'Click to edit transcript inline. System auto-learns accent patterns for batch correction.' },
          { title: 'Multi-Camera Sync Player', desc: 'Combine AI glasses, laparoscope, microscope sources with time-synced playback.' },
          { title: 'Surgical Knowledge Base', desc: '14 specialties, 6 standard procedures with steps, instruments, and bilingual anatomy.' },
          { title: 'Medical Terminology Glossary', desc: '44 built-in terms + custom terms to improve AI transcription accuracy.' },
          { title: 'Bilingual', desc: 'Full platform supports Traditional Chinese and English instant switching.' },
        ],
        notes: ['Demo: surgeon@demo.com / demo123', 'Works without API keys in demo mode', 'PWA supported — add to home screen from mobile browser'],
      },
    },
    upload: {
      zh: {
        title: '上傳影片',
        subtitle: '如何上傳手術影片並啟動 AI 自動處理',
        steps: [
          { title: '進入上傳頁面', desc: '點擊導航列的「上傳」按鈕，或在儀表板點擊「上傳影片」卡片。' },
          { title: '選擇或拖放影片', desc: '支援 MP4、MOV、WebM 格式。將影片拖放到上傳區域，或點擊「選擇檔案」。', tip: '建議影片大小不超過 500MB 以確保上傳順暢。' },
          { title: '填寫影片資訊', desc: '輸入影片標題（必填）、選擇手術類型和難度等級、填寫描述。' },
          { title: '（選填）加入課程資料', desc: '展開「課程資料與 AI 校正輔助」區塊，可貼上手術講義、專用術語清單、預期手術步驟。這些資料會大幅提升 AI 辨識精準度。', tip: '術語清單格式為「中文 = English」每行一個。' },
          { title: '點擊「開始上傳」', desc: 'AI 會自動開始處理：語音轉文字 → 自動分段 → 生成教案。處理完成後會自動跳轉到影片頁面。' },
        ],
      },
      en: {
        title: 'Upload Video',
        subtitle: 'How to upload surgical videos and trigger AI processing',
        steps: [
          { title: 'Go to Upload Page', desc: 'Click "Upload" in the navbar, or click "Upload Video" card on the dashboard.' },
          { title: 'Select or Drop Video', desc: 'Supports MP4, MOV, WebM. Drag & drop or click "Select File".', tip: 'Recommended max 500MB for smooth upload.' },
          { title: 'Fill Video Info', desc: 'Enter title (required), select surgery type and difficulty, add description.' },
          { title: '(Optional) Add Course Materials', desc: 'Expand "Course Materials & AI Correction" section. Paste surgical notes, terminology list, expected steps.', tip: 'Terminology format: "Chinese = English" one per line.' },
          { title: 'Click "Start Upload"', desc: 'AI auto-processes: speech-to-text → auto-segment → generate teaching materials. Redirects to video page when done.' },
        ],
      },
    },
    player: {
      zh: {
        title: '影片播放器',
        subtitle: '互動式影片觀看與學習介面',
        features: [
          { title: '章節跳轉', desc: '播放器下方有章節按鈕列，點擊任一章節即可跳轉。當前章節會以亮色標記。' },
          { title: '即時字幕', desc: '播放時自動顯示逐字稿字幕在影片下方。' },
          { title: '變速播放', desc: '點擊速度按鈕（1x）可切換 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x。' },
          { title: '側邊欄 Tabs', desc: '章節：瀏覽所有章節和關鍵時刻。逐字稿：完整逐字稿，點擊可跳轉。校正：逐字稿編輯和批次校正。工具：AI 快速生成和匯出。AI：對話式問答。' },
        ],
      },
      en: {
        title: 'Video Player',
        subtitle: 'Interactive video viewing and learning interface',
        features: [
          { title: 'Chapter Navigation', desc: 'Chapter buttons below player. Click to jump. Current chapter highlighted.' },
          { title: 'Live Subtitles', desc: 'Auto-display transcript as subtitles during playback.' },
          { title: 'Playback Speed', desc: 'Click speed button to cycle: 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x.' },
          { title: 'Sidebar Tabs', desc: 'Chapters, Transcript (clickable timestamps), Corrections, Tools (AI generate + export), AI Chat.' },
        ],
      },
    },
    ai: {
      zh: {
        title: 'AI 教學助手',
        subtitle: '基於影片內容的即時 AI 問答',
        steps: [
          { title: '進入 AI 助手', desc: '在影片頁面右側切換到「AI」分頁。' },
          { title: '輸入問題', desc: '在底部輸入框輸入你的問題，按 Enter 或點擊「傳送」。', tip: '可以問解剖結構、手術技巧、安全注意事項等任何與影片相關的問題。' },
          { title: 'AI 回答', desc: 'AI 會根據影片的逐字稿、教案、術語庫回答。回答通常包含結構化的重點和學習提示。' },
          { title: '追問', desc: '可以基於上一個回答繼續追問，AI 會記住對話脈絡。' },
        ],
        notes: ['建議問題範例：「這個結構是什麼？」「這個步驟的技巧要點？」「需要注意哪些安全事項？」「有替代的手術方式嗎？」'],
      },
      en: {
        title: 'AI Teaching Assistant',
        subtitle: 'Real-time AI Q&A based on video content',
        steps: [
          { title: 'Open AI Tab', desc: 'Switch to "AI" tab on the right sidebar of the video page.' },
          { title: 'Ask a Question', desc: 'Type your question and press Enter or click Send.', tip: 'Ask about anatomy, techniques, safety considerations — anything related to the video.' },
          { title: 'AI Responds', desc: 'AI answers based on transcript, teaching materials, and terminology. Answers include structured key points.' },
          { title: 'Follow Up', desc: 'Continue asking based on previous answers. AI remembers conversation context.' },
        ],
        notes: ['Example questions: "What is this structure?", "Key technique for this step?", "Safety considerations?", "Alternative approaches?"'],
      },
    },
    tools: {
      zh: {
        title: '教案製作工具',
        subtitle: '一鍵 AI 生成 + 匯出，將教案製作時間從 20 小時降至 10 分鐘',
        features: [
          { title: '影片標註', desc: '開啟標註模式後，可在影片畫面上繪製箭頭、圓圈、文字標記。支援 6 種顏色。標記會綁定到當前時間戳。' },
          { title: 'AI 生成測驗題', desc: '點擊「測驗」按鈕，AI 自動生成 5 題選擇題，含答案和解釋。適合學員自我測驗。' },
          { title: 'AI 提取學習重點', desc: '點擊「學習重點」，AI 提取 8-10 個關鍵學習要點，按重要度排序。' },
          { title: 'AI 臨床 Tips', desc: '點擊「臨床 Tips」，AI 生成 3-5 個實用臨床智慧。' },
          { title: 'AI 安全清單', desc: '點擊「安全清單」，自動產出術前/術中/術後確認清單。' },
          { title: '匯出 SRT 字幕', desc: '點擊 SRT 按鈕，下載帶時間戳的字幕檔。可匯入 Premiere、Final Cut 等編輯器。' },
          { title: '匯出 VTT 字幕', desc: '點擊 VTT 按鈕，下載網頁格式字幕檔。' },
          { title: '匯出 Markdown 教案', desc: '點擊 MD 按鈕，下載完整結構化教案文件（含摘要、章節、步驟、逐字稿）。' },
        ],
      },
      en: {
        title: 'Teaching Tools',
        subtitle: 'One-click AI generation + export — from 20 hours to 10 minutes',
        features: [
          { title: 'Video Annotation', desc: 'Toggle annotation mode to draw arrows, circles, text labels on video. 6 colors. Bound to current timestamp.' },
          { title: 'AI Quiz Generator', desc: 'Click "Quiz" — AI generates 5 MCQ with answers and explanations.' },
          { title: 'AI Key Points', desc: 'Click "Key Points" — AI extracts 8-10 ranked learning points.' },
          { title: 'AI Clinical Pearls', desc: 'Click "Clinical Pearls" — AI generates 3-5 practical wisdom tips.' },
          { title: 'AI Safety Checklist', desc: 'Click "Checklist" — auto-generate pre/intra/post-op checklist.' },
          { title: 'Export SRT', desc: 'Download timestamped subtitle file for video editors.' },
          { title: 'Export VTT', desc: 'Download web-format subtitle file.' },
          { title: 'Export Markdown', desc: 'Download full structured teaching document.' },
        ],
      },
    },
    correct: {
      zh: {
        title: '逐字稿校正',
        subtitle: '即時編輯 + 口音學習 + 批次替換',
        steps: [
          { title: '進入逐字稿分頁', desc: '在影片頁面切換到「逐字稿」分頁。醫師帳號會看到「點擊即可編輯」的提示。' },
          { title: '點擊任一段文字編輯', desc: '直接點擊要修改的逐字稿段落，會出現編輯框。修改完畢點擊「儲存」。', tip: '每次修正都會被系統記錄並學習。相同的錯誤出現 2 次以上會自動形成校正規則。' },
          { title: '使用批次校正', desc: '切換到「校正」分頁。在「批次尋找與替換」區塊輸入錯誤文字和正確文字，點擊「套用至所有影片」。', tip: '適用於口音造成的系統性轉譯錯誤，例如總是把「大腸」辨識成「大常」。' },
          { title: '查看已學習的校正模式', desc: '在校正分頁下方可看到系統從你的編輯中自動學習的規則，可一鍵套用。' },
        ],
      },
      en: {
        title: 'Transcript Correction',
        subtitle: 'Inline editing + accent learning + batch replacement',
        steps: [
          { title: 'Open Transcript Tab', desc: 'Switch to "Transcript" tab. Surgeon accounts see "click to edit" hint.' },
          { title: 'Click to Edit', desc: 'Click any transcript segment to open editor. Save when done.', tip: 'Each correction is recorded and learned. Same error 2+ times becomes an auto-rule.' },
          { title: 'Batch Correction', desc: 'Switch to "Correct" tab. Enter find/replace text, click "Apply to All Videos".', tip: 'Great for systematic accent errors.' },
          { title: 'View Learned Patterns', desc: 'See auto-learned rules below. One-click to apply across all videos.' },
        ],
      },
    },
    session: {
      zh: {
        title: '多鏡頭案例',
        subtitle: '整合同一台手術的多個鏡頭影像',
        steps: [
          { title: '先上傳各鏡頭的影片', desc: '分別上傳 AI 眼鏡、腹腔鏡、手術室全景等各來源的影片。' },
          { title: '建立手術案例', desc: '進入「案例」頁面，點擊「新增案例」。填寫標題和手術類型。' },
          { title: '加入影像來源', desc: '為每個來源選擇影片、來源類型（AI 眼鏡/腹腔鏡/顯微鏡等）、標籤。設定一個為「主要」來源。' },
          { title: '設定時間偏移', desc: '主要來源偏移為 0。其他來源輸入毫秒偏移量。正值=較晚開始，負值=較早開始。', tip: '可用影片中的明確事件（如電燒聲音）對齊各來源。' },
          { title: '同步播放', desc: '在案例頁面可選擇：單一（切換來源）、並排（兩畫面）、PiP（子母畫面）三種佈局。' },
        ],
      },
      en: {
        title: 'Multi-Camera Sessions',
        subtitle: 'Combine multiple camera sources from the same surgery',
        steps: [
          { title: 'Upload Each Source', desc: 'Upload AI glasses, laparoscope, room camera videos separately.' },
          { title: 'Create Session', desc: 'Go to "Cases" page, click "New Session". Fill title and surgery type.' },
          { title: 'Add Video Sources', desc: 'Select video, source type, label for each. Set one as "Primary".' },
          { title: 'Set Time Offsets', desc: 'Primary = 0ms. Others: positive=started later, negative=started earlier.', tip: 'Use clear audio events (like cautery sounds) to align sources.' },
          { title: 'Sync Playback', desc: 'View in Single (switch sources), Split (side-by-side), or PiP layout.' },
        ],
      },
    },
    knowledge: {
      zh: {
        title: '手術知識庫',
        subtitle: '14 專科標準術式、步驟、器械與解剖結構',
        features: [
          { title: '瀏覽術式', desc: '在知識庫頁面可按專科篩選，點擊術式卡片查看詳情。' },
          { title: '查看步驟', desc: '每個術式的「手術步驟」分頁列出所有標準步驟、時間估計和要點提醒。' },
          { title: '查看器械', desc: '「器械」分頁列出所需器械清單，標記必要/選用。' },
          { title: '查看解剖', desc: '「解剖結構」分頁以卡片顯示相關結構，標記重要度（CRITICAL/HIGH/NORMAL）和類別。' },
          { title: '匯入手術說明', desc: '點擊「匯入手術說明」按鈕，貼入任何手術文字，AI 自動提取術語、步驟和器械。提取結果可一鍵儲存到術語庫。' },
        ],
      },
      en: {
        title: 'Knowledge Base',
        subtitle: '14 specialties with standard procedures, steps, instruments, and anatomy',
        features: [
          { title: 'Browse Procedures', desc: 'Filter by specialty. Click procedure cards for details.' },
          { title: 'View Steps', desc: '"Steps" tab lists all standard steps with time estimates and key point alerts.' },
          { title: 'View Instruments', desc: '"Instruments" tab lists required equipment, marked essential/optional.' },
          { title: 'View Anatomy', desc: '"Anatomy" tab shows related structures with importance (CRITICAL/HIGH/NORMAL).' },
          { title: 'Import Description', desc: 'Click "Import Description", paste any surgical text, AI extracts terms, steps, instruments. Save to glossary.' },
        ],
      },
    },
    glossary: {
      zh: {
        title: '醫學術語對照表',
        subtitle: '中英文術語管理，提升 AI 轉譯準確度',
        steps: [
          { title: '瀏覽術語', desc: '進入「術語」頁面，可按類別（解剖/器械/術式/病理）篩選，或搜尋特定術語。' },
          { title: '新增自訂術語', desc: '在頁面頂部輸入中文、英文和類別，點擊「新增」。自訂術語會影響後續 AI 轉譯的準確度。', tip: '例如你的科室有特殊用語，可以加入讓 AI 學會。' },
          { title: '刪除自訂術語', desc: '自訂術語可刪除（系統內建的不可刪除）。' },
        ],
        notes: ['目前內建 44 個常用外科術語', '術語庫會在 AI 處理影片時自動載入作為 context'],
      },
      en: {
        title: 'Medical Terminology Glossary',
        subtitle: 'Bilingual term management to improve AI accuracy',
        steps: [
          { title: 'Browse Terms', desc: 'Go to "Glossary" page. Filter by category or search.' },
          { title: 'Add Custom Terms', desc: 'Enter Chinese, English, and category at the top. Click "Add".', tip: 'Custom terms improve AI transcription for your specific terminology.' },
          { title: 'Delete Custom Terms', desc: 'Custom terms can be deleted (system built-in terms cannot).' },
        ],
        notes: ['44 built-in surgical terms', 'Terminology auto-loaded during AI video processing'],
      },
    },
    faq: {
      zh: {
        title: '常見問題',
        subtitle: '快速解答使用上的疑問',
        features: [
          { title: 'Q: 沒有 API Key 可以用嗎？', desc: 'A: 可以。平台有完整的 demo 模式，使用內建的模擬逐字稿和教案。要啟用真實 AI，需在 .env.local 填入 Anthropic 和 OpenAI 的 API Key。' },
          { title: 'Q: 支援哪些影片格式？', desc: 'A: MP4、MOV、WebM。建議使用 H.264 編碼的 MP4。' },
          { title: 'Q: AI 處理需要多久？', desc: 'A: Demo 模式即時完成。真實 AI 處理約 1-3 分鐘（視影片長度和語音內容）。' },
          { title: 'Q: 逐字稿不準確怎麼辦？', desc: 'A: 使用逐字稿校正功能直接編輯。系統會自動學習你的修正模式，後續影片會更準確。也可在上傳時加入術語清單輔助。' },
          { title: 'Q: 可以在手機上使用嗎？', desc: 'A: 可以。平台支援 RWD 和 PWA。從手機瀏覽器開啟後，可「加入主畫面」像 App 一樣使用。' },
          { title: 'Q: 影片資料安全嗎？', desc: 'A: 目前為 demo 版本。正式版會加入 HIPAA/個資法合規的加密和去識別化功能。' },
          { title: 'Q: 如何切換語言？', desc: 'A: 點擊導航列右上角的「En」或「中」按鈕即可即時切換。' },
        ],
      },
      en: {
        title: 'FAQ',
        subtitle: 'Quick answers to common questions',
        features: [
          { title: 'Q: Can I use without API keys?', desc: 'A: Yes. Full demo mode with built-in sample data. For real AI, add Anthropic + OpenAI keys to .env.local.' },
          { title: 'Q: Supported video formats?', desc: 'A: MP4, MOV, WebM. Recommended: H.264 encoded MP4.' },
          { title: 'Q: How long does AI processing take?', desc: 'A: Demo mode is instant. Real AI takes 1-3 minutes depending on video length.' },
          { title: 'Q: Transcript not accurate?', desc: 'A: Use transcript correction to edit inline. System auto-learns your patterns. Add terminology list when uploading.' },
          { title: 'Q: Works on mobile?', desc: 'A: Yes. RWD + PWA supported. Add to home screen from mobile browser.' },
          { title: 'Q: Is data secure?', desc: 'A: Current demo version. Production will include HIPAA-compliant encryption and de-identification.' },
          { title: 'Q: How to switch language?', desc: 'A: Click "En" or "中" button in the top-right of the navbar.' },
        ],
      },
    },
  };

  const c = content[id];
  return c ? (isEn ? c.en : c.zh) : { title: '', subtitle: '' };
}

const sectionLabels: Record<string, { zh: string; en: string }> = {
  overview: { zh: '平台總覽', en: 'Overview' },
  upload: { zh: '上傳影片', en: 'Upload' },
  player: { zh: '影片播放器', en: 'Player' },
  ai: { zh: 'AI 問答', en: 'AI Q&A' },
  tools: { zh: '教案工具', en: 'Tools' },
  correct: { zh: '逐字稿校正', en: 'Correction' },
  session: { zh: '多鏡頭案例', en: 'Sessions' },
  knowledge: { zh: '知識庫', en: 'Knowledge' },
  glossary: { zh: '術語對照', en: 'Glossary' },
  faq: { zh: '常見問題', en: 'FAQ' },
};

export default function GuidePage() {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const [activeSection, setActiveSection] = useState('overview');

  const content = getContent(activeSection, isEn);

  return (
    <div className="min-h-screen" style={{ background: '#060b18' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{isEn ? 'User Guide' : '操作手冊'}</h1>
          <p className="text-slate-400 text-sm">{isEn ? 'Everything you need to know to use SurgAI' : '使用 SurgAI 平台的完整操作指南'}</p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar Nav */}
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.id ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={activeSection === s.id ? { background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' } : { border: '1px solid transparent' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
                {isEn ? sectionLabels[s.id].en : sectionLabels[s.id].zh}
              </button>
            ))}
            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                {isEn ? 'Back to Platform' : '返回平台'}
              </Link>
            </div>
          </nav>

          {/* Content */}
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(8px)' }}>
            <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
            <p className="text-slate-400 mb-8">{content.subtitle}</p>

            {/* Steps */}
            {content.steps && (
              <div className="space-y-5">
                {content.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                      {step.tip && (
                        <div className="mt-2 flex items-start gap-2 text-xs rounded-lg p-2.5" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                          <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-cyan-300">{step.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Features */}
            {content.features && (
              <div className="space-y-4">
                {content.features.map((f, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {content.notes && (
              <div className="mt-8 rounded-xl p-4" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }}>
                <p className="text-xs font-semibold text-cyan-400 mb-2">{isEn ? 'Notes' : '備註'}</p>
                {content.notes.map((n, i) => (
                  <p key={i} className="text-xs text-slate-400 mb-1 flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">&#8226;</span> {n}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
