import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export function seedKnowledgeBase(db: Database.Database) {
  const specCount = db.prepare('SELECT COUNT(*) as c FROM specialties').get() as { c: number };
  if (specCount.c > 0) return; // Already seeded

  const insertSpec = db.prepare('INSERT INTO specialties (id, name_zh, name_en, icon, order_index) VALUES (?,?,?,?,?)');
  const insertProc = db.prepare('INSERT INTO procedures (id, specialty_id, name_zh, name_en, description_zh, description_en, difficulty, duration_min, duration_max, icd_code) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const insertStep = db.prepare('INSERT INTO procedure_steps (id, procedure_id, step_number, name_zh, name_en, description_zh, description_en, key_points_zh, key_points_en, duration_minutes) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const insertInst = db.prepare('INSERT INTO procedure_instruments (id, procedure_id, name_zh, name_en, category, is_essential) VALUES (?,?,?,?,?,?)');
  const insertAnat = db.prepare('INSERT INTO procedure_anatomy (id, procedure_id, name_zh, name_en, category, importance, description_zh, description_en) VALUES (?,?,?,?,?,?,?,?)');

  const seed = db.transaction(() => {
    // ================================================================
    // SPECIALTIES
    // ================================================================
    const specs: Record<string, string> = {};
    const specialties = [
      ['一般外科', 'General Surgery', '🔪', 1],
      ['肝膽胰外科', 'Hepatobiliary & Pancreatic Surgery', '🫁', 2],
      ['大腸直腸外科', 'Colorectal Surgery', '🩺', 3],
      ['胃腸外科', 'Upper GI Surgery', '🫃', 4],
      ['乳房外科', 'Breast Surgery', '🎀', 5],
      ['甲狀腺/內分泌外科', 'Thyroid & Endocrine Surgery', '🦋', 6],
      ['心臟血管外科', 'Cardiovascular Surgery', '❤️', 7],
      ['胸腔外科', 'Thoracic Surgery', '🫁', 8],
      ['神經外科', 'Neurosurgery', '🧠', 9],
      ['骨科', 'Orthopedic Surgery', '🦴', 10],
      ['泌尿外科', 'Urology', '💧', 11],
      ['整形外科', 'Plastic Surgery', '✨', 12],
      ['小兒外科', 'Pediatric Surgery', '👶', 13],
      ['移植外科', 'Transplant Surgery', '🔄', 14],
    ] as const;

    for (const [zh, en, icon, idx] of specialties) {
      const id = randomUUID();
      specs[zh] = id;
      insertSpec.run(id, zh, en, icon, idx);
    }

    // ================================================================
    // PROCEDURES + STEPS + INSTRUMENTS + ANATOMY
    // ================================================================

    // Helper
    function addProcedure(
      specZh: string,
      p: { zh: string; en: string; descZh: string; descEn: string; diff: string; durMin: number; durMax: number; icd: string },
      steps: Array<{ zh: string; en: string; descZh: string; descEn: string; keyZh: string; keyEn: string; dur: number }>,
      instruments: Array<{ zh: string; en: string; cat: string; essential: number }>,
      anatomy: Array<{ zh: string; en: string; cat: string; imp: string; descZh: string; descEn: string }>
    ) {
      const procId = randomUUID();
      insertProc.run(procId, specs[specZh], p.zh, p.en, p.descZh, p.descEn, p.diff, p.durMin, p.durMax, p.icd);
      steps.forEach((s, i) => insertStep.run(randomUUID(), procId, i + 1, s.zh, s.en, s.descZh, s.descEn, s.keyZh, s.keyEn, s.dur));
      instruments.forEach(inst => insertInst.run(randomUUID(), procId, inst.zh, inst.en, inst.cat, inst.essential));
      anatomy.forEach(a => insertAnat.run(randomUUID(), procId, a.zh, a.en, a.cat, a.imp, a.descZh, a.descEn));
    }

    // ----------------------------------------------------------------
    // 1. 腹腔鏡膽囊切除術
    // ----------------------------------------------------------------
    addProcedure('肝膽胰外科', {
      zh: '腹腔鏡膽囊切除術', en: 'Laparoscopic Cholecystectomy',
      descZh: '以腹腔鏡微創方式切除膽囊，是膽結石的標準治療方式。全球每年執行超過100萬例，是住院醫師必學的基本術式。',
      descEn: 'Minimally invasive removal of the gallbladder via laparoscope. Standard treatment for gallstones with over 1 million performed annually worldwide.',
      diff: 'intermediate', durMin: 30, durMax: 90, icd: '51.23'
    }, [
      { zh: '全身麻醉與體位擺設', en: 'General Anesthesia & Positioning', descZh: '仰臥位，頭高腳低（reverse Trendelenburg）', descEn: 'Supine position, reverse Trendelenburg', keyZh: '確認氣管插管位置，預防靜脈栓塞', keyEn: 'Confirm ETT position, DVT prophylaxis', dur: 10 },
      { zh: '建立氣腹與 Trocar 置放', en: 'Pneumoperitoneum & Trocar Placement', descZh: '臍部 Veress needle 或 open technique 建立 CO2 氣腹（12-15mmHg），置放 4 個 trocar', descEn: 'Establish CO2 pneumoperitoneum at 12-15mmHg via umbilical Veress needle or open technique, place 4 trocars', keyZh: '小心穿刺避免腸道損傷，確認氣腹壓力穩定', keyEn: 'Careful insertion to avoid bowel injury, confirm stable pneumoperitoneum', dur: 5 },
      { zh: '暴露膽囊與 Calot\'s Triangle', en: 'Gallbladder Exposure & Calot\'s Triangle Dissection', descZh: '抓住膽囊底部向頭側牽引，暴露 Calot\'s triangle，以鈍性和銳性分離辨識膽囊管和膽囊動脈', descEn: 'Grasp fundus cephalad, expose Calot\'s triangle, identify cystic duct and artery through blunt and sharp dissection', keyZh: '這是最關鍵的步驟，必須達成 Critical View of Safety', keyEn: 'Most critical step — must achieve Critical View of Safety', dur: 15 },
      { zh: '達成 Critical View of Safety', en: 'Achieve Critical View of Safety', descZh: '確認 Calot\'s triangle 中僅有兩條管狀結構連接膽囊，肝膽囊床的下1/3已暴露', descEn: 'Confirm only two tubular structures entering gallbladder in Calot\'s triangle, lower 1/3 of hepatocystic plate cleared', keyZh: 'CVS 三要素：兩條結構、膽囊頸清楚、肝床暴露', keyEn: 'CVS criteria: two structures only, cleared gallbladder neck, exposed hepatocystic plate', dur: 10 },
      { zh: '夾閉並切斷膽囊管與膽囊動脈', en: 'Clip & Divide Cystic Duct and Artery', descZh: '分別以金屬夾夾住膽囊管和膽囊動脈（近端2個、遠端1個），確認後切斷', descEn: 'Apply clips to cystic duct and artery (2 proximal, 1 distal), confirm and divide', keyZh: '確認夾子位置正確，勿夾到總膽管', keyEn: 'Verify clip placement, avoid CBD injury', dur: 5 },
      { zh: '從肝床分離膽囊', en: 'Gallbladder Dissection from Liver Bed', descZh: '使用電燒或超音波刀沿著正確的解剖平面將膽囊從肝床上分離', descEn: 'Dissect gallbladder from liver bed using electrocautery or harmonic scalpel along correct anatomic plane', keyZh: '保持正確分離面，避免進入肝實質', keyEn: 'Maintain correct dissection plane, avoid entering liver parenchyma', dur: 10 },
      { zh: '止血確認與膽囊取出', en: 'Hemostasis Check & Specimen Retrieval', descZh: '檢查肝床和夾子處止血情況，使用取物袋取出膽囊', descEn: 'Check hemostasis at liver bed and clip sites, retrieve gallbladder in specimen bag', keyZh: '仔細檢查有無膽汁滲漏或出血', keyEn: 'Carefully check for bile leak or bleeding', dur: 5 },
      { zh: '移除 Trocar 與傷口縫合', en: 'Trocar Removal & Wound Closure', descZh: '在目視下移除 trocar，釋放氣腹，縫合筋膜和皮膚', descEn: 'Remove trocars under direct vision, release pneumoperitoneum, close fascia and skin', keyZh: '>10mm trocar 傷口需縫合筋膜以預防疝氣', keyEn: 'Close fascia at >10mm trocar sites to prevent hernia', dur: 5 },
    ], [
      { zh: '腹腔鏡（30度）', en: '30-degree Laparoscope', cat: 'optical', essential: 1 },
      { zh: '氣腹機', en: 'Insufflator', cat: 'general', essential: 1 },
      { zh: 'Trocar 10mm x2', en: '10mm Trocar x2', cat: 'access', essential: 1 },
      { zh: 'Trocar 5mm x2', en: '5mm Trocar x2', cat: 'access', essential: 1 },
      { zh: '抓鉗', en: 'Grasping Forceps', cat: 'grasping', essential: 1 },
      { zh: '分離鉗（Maryland）', en: 'Maryland Dissector', cat: 'dissection', essential: 1 },
      { zh: '電燒鉤（L-hook）', en: 'L-hook Electrocautery', cat: 'energy', essential: 1 },
      { zh: '鈦金屬夾（Clip Applier）', en: 'Titanium Clip Applier', cat: 'hemostasis', essential: 1 },
      { zh: '剪刀', en: 'Laparoscopic Scissors', cat: 'cutting', essential: 1 },
      { zh: '取物袋', en: 'Specimen Retrieval Bag', cat: 'retrieval', essential: 1 },
      { zh: '吸引沖洗管', en: 'Suction-Irrigation Device', cat: 'general', essential: 0 },
      { zh: '超音波刀', en: 'Harmonic Scalpel', cat: 'energy', essential: 0 },
    ], [
      { zh: '膽囊', en: 'Gallbladder', cat: 'organ', imp: 'critical', descZh: '位於肝臟下方的梨形器官，儲存膽汁', descEn: 'Pear-shaped organ beneath the liver that stores bile' },
      { zh: '膽囊管', en: 'Cystic Duct', cat: 'duct', imp: 'critical', descZh: '連接膽囊與總膽管的管道，長約3-4cm', descEn: 'Duct connecting gallbladder to CBD, approximately 3-4cm long' },
      { zh: '膽囊動脈', en: 'Cystic Artery', cat: 'vessel', imp: 'critical', descZh: '通常由右肝動脈分支而來，供應膽囊血流', descEn: 'Usually branches from right hepatic artery, supplies gallbladder' },
      { zh: '膽囊三角（Calot\'s Triangle）', en: 'Calot\'s Triangle', cat: 'landmark', imp: 'critical', descZh: '由膽囊管、肝總管、肝臟下緣構成的三角區域', descEn: 'Triangle formed by cystic duct, common hepatic duct, and liver edge' },
      { zh: '總膽管', en: 'Common Bile Duct (CBD)', cat: 'duct', imp: 'critical', descZh: '攜帶膽汁至十二指腸的主要管道，損傷是最嚴重的併發症', descEn: 'Main duct carrying bile to duodenum, injury is the most serious complication' },
      { zh: '肝總管', en: 'Common Hepatic Duct', cat: 'duct', imp: 'high', descZh: '左右肝管匯合後形成', descEn: 'Formed by confluence of left and right hepatic ducts' },
      { zh: '右肝動脈', en: 'Right Hepatic Artery', cat: 'vessel', imp: 'high', descZh: '膽囊動脈的母血管，變異率高', descEn: 'Parent vessel of cystic artery, high anatomic variation rate' },
      { zh: '肝門靜脈', en: 'Portal Vein', cat: 'vessel', imp: 'high', descZh: '位於肝十二指腸韌帶內的主要靜脈', descEn: 'Major vein within hepatoduodenal ligament' },
      { zh: '肝十二指腸韌帶', en: 'Hepatoduodenal Ligament', cat: 'landmark', imp: 'high', descZh: '包含肝門三聯（膽管、門靜脈、肝動脈）', descEn: 'Contains portal triad (bile duct, portal vein, hepatic artery)' },
      { zh: '肝膽囊床', en: 'Gallbladder Fossa (Liver Bed)', cat: 'landmark', imp: 'normal', descZh: '膽囊附著於肝臟的區域', descEn: 'Area where gallbladder attaches to the liver' },
    ]);

    // ----------------------------------------------------------------
    // 2. 腹腔鏡闌尾切除術
    // ----------------------------------------------------------------
    addProcedure('一般外科', {
      zh: '腹腔鏡闌尾切除術', en: 'Laparoscopic Appendectomy',
      descZh: '以腹腔鏡微創方式切除發炎的闌尾，是急性闌尾炎的標準手術治療。', descEn: 'Minimally invasive removal of the inflamed appendix, standard surgical treatment for acute appendicitis.',
      diff: 'beginner', durMin: 20, durMax: 60, icd: '47.01'
    }, [
      { zh: '麻醉與體位', en: 'Anesthesia & Positioning', descZh: '全身麻醉，仰臥位', descEn: 'General anesthesia, supine position', keyZh: '可採 Trendelenburg + 左傾以利暴露', keyEn: 'May use Trendelenburg + left tilt for exposure', dur: 5 },
      { zh: '建立氣腹與 Trocar 置放', en: 'Pneumoperitoneum & Trocar Placement', descZh: '臍部建立氣腹，置放 3 個 trocar（臍部 10mm、左下腹 5mm、恥骨上 5mm）', descEn: 'Establish pneumoperitoneum at umbilicus, place 3 trocars', keyZh: '注意臍部 trocar 穿刺避免腸損傷', keyEn: 'Careful umbilical trocar insertion to avoid bowel injury', dur: 5 },
      { zh: '辨識闌尾與分離腸繫膜', en: 'Identify Appendix & Mesoappendix Dissection', descZh: '追蹤結腸帶（taenia coli）至盲腸底部找到闌尾，分離闌尾腸繫膜', descEn: 'Follow taenia coli to cecal base to locate appendix, dissect mesoappendix', keyZh: '確認闌尾基部位置，避免誤傷迴腸', keyEn: 'Confirm appendix base location, avoid ileal injury', dur: 10 },
      { zh: '處理闌尾動脈', en: 'Mesoappendix & Appendicular Artery Control', descZh: '使用超音波刀、電燒或結紮處理闌尾腸繫膜和闌尾動脈', descEn: 'Control mesoappendix and appendicular artery using harmonic, electrocautery, or ligation', keyZh: '確保血管完全止血', keyEn: 'Ensure complete vascular hemostasis', dur: 5 },
      { zh: '切除闌尾', en: 'Appendix Transection', descZh: '在闌尾基部以 Endoloop 或釘合器切除闌尾', descEn: 'Transect appendix at base using Endoloop or stapler', keyZh: '基部保留足夠殘端，避免滑脫', keyEn: 'Leave adequate stump, prevent slippage', dur: 5 },
      { zh: '止血與清洗', en: 'Hemostasis & Irrigation', descZh: '檢查殘端止血，沖洗腹腔（如有膿瘍）', descEn: 'Check stump hemostasis, irrigate abdomen if abscess present', keyZh: '膿瘍時需徹底沖洗', keyEn: 'Thorough irrigation for abscess cases', dur: 5 },
    ], [
      { zh: '腹腔鏡（30度）', en: '30-degree Laparoscope', cat: 'optical', essential: 1 },
      { zh: 'Trocar 10mm x1', en: '10mm Trocar x1', cat: 'access', essential: 1 },
      { zh: 'Trocar 5mm x2', en: '5mm Trocar x2', cat: 'access', essential: 1 },
      { zh: '抓鉗', en: 'Grasping Forceps', cat: 'grasping', essential: 1 },
      { zh: 'Endoloop', en: 'Endoloop', cat: 'ligation', essential: 1 },
      { zh: '超音波刀', en: 'Harmonic Scalpel', cat: 'energy', essential: 0 },
      { zh: '取物袋', en: 'Specimen Retrieval Bag', cat: 'retrieval', essential: 1 },
    ], [
      { zh: '闌尾', en: 'Appendix', cat: 'organ', imp: 'critical', descZh: '盲腸末端的管狀淋巴器官', descEn: 'Tubular lymphoid organ at the tip of the cecum' },
      { zh: '盲腸', en: 'Cecum', cat: 'organ', imp: 'high', descZh: '大腸的起始部分', descEn: 'Beginning of the large intestine' },
      { zh: '闌尾動脈', en: 'Appendicular Artery', cat: 'vessel', imp: 'critical', descZh: '迴結腸動脈的分支', descEn: 'Branch of the ileocolic artery' },
      { zh: '闌尾腸繫膜', en: 'Mesoappendix', cat: 'structure', imp: 'high', descZh: '包含闌尾動脈的腸繫膜', descEn: 'Mesentery containing the appendicular artery' },
      { zh: '結腸帶', en: 'Taenia Coli', cat: 'landmark', imp: 'normal', descZh: '追蹤至盲腸底可定位闌尾', descEn: 'Following to cecal base locates the appendix' },
      { zh: '迴腸末端', en: 'Terminal Ileum', cat: 'organ', imp: 'normal', descZh: '位於闌尾附近，需避免誤傷', descEn: 'Located near appendix, must avoid injury' },
    ]);

    // ----------------------------------------------------------------
    // 3. 腹腔鏡疝氣修補術
    // ----------------------------------------------------------------
    addProcedure('一般外科', {
      zh: '腹腔鏡腹股溝疝氣修補術（TAPP）', en: 'Laparoscopic Inguinal Hernia Repair (TAPP)',
      descZh: '經腹腔腹膜前修補術，以人工網膜覆蓋疝氣缺口。', descEn: 'Transabdominal preperitoneal repair using mesh to cover hernia defect.',
      diff: 'intermediate', durMin: 40, durMax: 90, icd: '53.63'
    }, [
      { zh: '麻醉與建立氣腹', en: 'Anesthesia & Pneumoperitoneum', descZh: '全身麻醉，建立 CO2 氣腹', descEn: 'General anesthesia, establish CO2 pneumoperitoneum', keyZh: '確認對側有無隱性疝氣', keyEn: 'Check for contralateral occult hernia', dur: 10 },
      { zh: '辨識疝氣缺口與解剖標誌', en: 'Identify Hernia Defect & Landmarks', descZh: '辨識內環、外環、Cooper\'s ligament、恥骨結節等標誌', descEn: 'Identify internal ring, external ring, Cooper\'s ligament, pubic tubercle', keyZh: '明確區分直接疝和間接疝', keyEn: 'Differentiate direct from indirect hernia', dur: 5 },
      { zh: '切開腹膜瓣', en: 'Peritoneal Flap Incision', descZh: '在疝氣缺口上方橫向切開腹膜，建立腹膜前空間', descEn: 'Transversely incise peritoneum above hernia defect, create preperitoneal space', keyZh: '切開位置要夠高，確保足夠的網膜覆蓋範圍', keyEn: 'Incise high enough to ensure adequate mesh overlap', dur: 10 },
      { zh: '剝離腹膜前空間', en: 'Preperitoneal Space Dissection', descZh: '在 Doom Triangle 和 Pain Triangle 之間安全剝離', descEn: 'Safely dissect between Triangle of Doom and Triangle of Pain', keyZh: '避免損傷精索血管、輸精管和外側神經', keyEn: 'Avoid injury to spermatic vessels, vas deferens, and lateral nerves', dur: 15 },
      { zh: '置放人工網膜', en: 'Mesh Placement', descZh: '放置 15x10cm 網膜覆蓋所有潛在疝氣缺口（直接、間接、股疝）', descEn: 'Place 15x10cm mesh covering all potential hernia sites (direct, indirect, femoral)', keyZh: '網膜平整無皺摺，內側超過恥骨中線', keyEn: 'Mesh flat without wrinkles, medial edge past midline of pubis', dur: 5 },
      { zh: '關閉腹膜', en: 'Peritoneal Closure', descZh: '以連續縫合或釘合器關閉腹膜瓣', descEn: 'Close peritoneal flap with continuous suture or tacker', keyZh: '完全密封防止腸道接觸網膜', keyEn: 'Ensure complete seal to prevent bowel contact with mesh', dur: 10 },
    ], [
      { zh: '腹腔鏡（30度）', en: '30-degree Laparoscope', cat: 'optical', essential: 1 },
      { zh: '人工網膜（15x10cm）', en: 'Polypropylene Mesh 15x10cm', cat: 'implant', essential: 1 },
      { zh: '腹膜釘合器（Tacker）', en: 'AbsorbaTack / ProTack', cat: 'fixation', essential: 0 },
      { zh: '剝離器', en: 'Dissecting Forceps', cat: 'dissection', essential: 1 },
      { zh: '剪刀', en: 'Laparoscopic Scissors', cat: 'cutting', essential: 1 },
    ], [
      { zh: '腹股溝管', en: 'Inguinal Canal', cat: 'landmark', imp: 'critical', descZh: '斜行通過腹壁的管道', descEn: 'Oblique passage through the abdominal wall' },
      { zh: '精索 / 圓韌帶', en: 'Spermatic Cord / Round Ligament', cat: 'structure', imp: 'critical', descZh: '穿過腹股溝管的結構', descEn: 'Structure passing through inguinal canal' },
      { zh: 'Cooper\'s 韌帶', en: 'Cooper\'s Ligament', cat: 'landmark', imp: 'high', descZh: '恥骨上緣的骨膜增厚處，網膜固定的重要標誌', descEn: 'Thickened periosteum on superior pubic ramus, key landmark for mesh fixation' },
      { zh: '死亡三角（Triangle of Doom）', en: 'Triangle of Doom', cat: 'danger_zone', imp: 'critical', descZh: '含外髂血管，由精索和輸精管構成邊界', descEn: 'Contains external iliac vessels, bordered by spermatic vessels and vas deferens' },
      { zh: '疼痛三角（Triangle of Pain）', en: 'Triangle of Pain', cat: 'danger_zone', imp: 'critical', descZh: '含股外側皮神經等，位於精索外側', descEn: 'Contains lateral femoral cutaneous nerve, lateral to spermatic vessels' },
    ]);

    // ----------------------------------------------------------------
    // 4. 甲狀腺切除術
    // ----------------------------------------------------------------
    addProcedure('甲狀腺/內分泌外科', {
      zh: '甲狀腺切除術', en: 'Thyroidectomy',
      descZh: '切除部分或全部甲狀腺組織，適用於甲狀腺結節、甲狀腺癌或甲狀腺功能亢進。', descEn: 'Partial or total removal of thyroid tissue for nodules, cancer, or hyperthyroidism.',
      diff: 'advanced', durMin: 60, durMax: 180, icd: '06.4'
    }, [
      { zh: '皮膚切開與皮瓣翻起', en: 'Skin Incision & Flap Elevation', descZh: '在鎖骨上方做橫向 Kocher 切口，翻起皮瓣至甲狀軟骨上緣', descEn: 'Make transverse Kocher incision above clavicle, elevate flaps to upper thyroid cartilage', keyZh: '沿著皮紋切開以減少疤痕', keyEn: 'Incise along skin crease to minimize scarring', dur: 15 },
      { zh: '分離帶狀肌', en: 'Strap Muscle Separation', descZh: '沿中線分開胸骨舌骨肌和胸骨甲狀肌', descEn: 'Separate sternohyoid and sternothyroid muscles along midline', keyZh: '保留帶狀肌以利術後外觀', keyEn: 'Preserve strap muscles for postoperative appearance', dur: 5 },
      { zh: '辨識與保護返喉神經', en: 'Identify & Preserve Recurrent Laryngeal Nerve', descZh: '在氣管食道溝或 Berry\'s ligament 附近辨識返喉神經', descEn: 'Identify RLN near tracheoesophageal groove or Berry\'s ligament', keyZh: '全程可視化神經走行，可使用神經監測儀', keyEn: 'Visualize nerve throughout, consider nerve monitoring', dur: 20 },
      { zh: '辨識與保護副甲狀腺', en: 'Identify & Preserve Parathyroid Glands', descZh: '在甲狀腺後方辨識上下副甲狀腺（通常4顆）', descEn: 'Identify superior and inferior parathyroid glands posterior to thyroid (usually 4)', keyZh: '保留血供，必要時自體移植', keyEn: 'Preserve blood supply, autotransplant if devascularized', dur: 10 },
      { zh: '結紮甲狀腺血管', en: 'Ligate Thyroid Vessels', descZh: '分別結紮上下甲狀腺動脈和靜脈', descEn: 'Ligate superior and inferior thyroid arteries and veins', keyZh: '上動脈需在腺體表面結紮，避免傷上喉神經', keyEn: 'Ligate superior artery close to gland to avoid superior laryngeal nerve', dur: 15 },
      { zh: '甲狀腺葉切除', en: 'Thyroid Lobe Excision', descZh: '沿著氣管表面將甲狀腺從氣管和食道上剝離', descEn: 'Dissect thyroid off trachea and esophagus along their surfaces', keyZh: '在 Berry\'s ligament 附近特別小心返喉神經', keyEn: 'Extra caution near Berry\'s ligament for RLN', dur: 15 },
      { zh: '止血與傷口關閉', en: 'Hemostasis & Closure', descZh: '仔細止血，考慮放置引流管，逐層關閉', descEn: 'Meticulous hemostasis, consider drain placement, layered closure', keyZh: '術後注意呼吸道水腫和低血鈣', keyEn: 'Monitor for airway edema and hypocalcemia postoperatively', dur: 10 },
    ], [
      { zh: '電燒', en: 'Electrocautery', cat: 'energy', essential: 1 },
      { zh: '超音波刀', en: 'Harmonic Scalpel', cat: 'energy', essential: 0 },
      { zh: '神經監測儀（NIM）', en: 'Nerve Integrity Monitor (NIM)', cat: 'monitoring', essential: 0 },
      { zh: '甲狀腺拉鉤', en: 'Thyroid Retractor', cat: 'retraction', essential: 1 },
      { zh: '血管夾', en: 'Vascular Clips', cat: 'hemostasis', essential: 1 },
      { zh: '引流管', en: 'Drain', cat: 'drainage', essential: 0 },
    ], [
      { zh: '甲狀腺', en: 'Thyroid Gland', cat: 'organ', imp: 'critical', descZh: '蝴蝶形內分泌腺體，位於氣管前方', descEn: 'Butterfly-shaped endocrine gland anterior to trachea' },
      { zh: '返喉神經', en: 'Recurrent Laryngeal Nerve (RLN)', cat: 'nerve', imp: 'critical', descZh: '支配聲帶運動，損傷導致聲音沙啞或呼吸困難', descEn: 'Innervates vocal cords, injury causes hoarseness or airway compromise' },
      { zh: '上喉神經外支', en: 'External Branch of Superior Laryngeal Nerve', cat: 'nerve', imp: 'high', descZh: '支配環甲肌，損傷影響高音發聲', descEn: 'Innervates cricothyroid, injury affects high-pitch voice' },
      { zh: '副甲狀腺', en: 'Parathyroid Glands', cat: 'organ', imp: 'critical', descZh: '通常4顆，控制鈣質代謝', descEn: 'Usually 4 glands, control calcium metabolism' },
      { zh: '上甲狀腺動脈', en: 'Superior Thyroid Artery', cat: 'vessel', imp: 'high', descZh: '外頸動脈的第一分支', descEn: 'First branch of external carotid artery' },
      { zh: '下甲狀腺動脈', en: 'Inferior Thyroid Artery', cat: 'vessel', imp: 'high', descZh: '甲狀頸幹分支，與返喉神經關係密切', descEn: 'Branch of thyrocervical trunk, closely related to RLN' },
      { zh: 'Berry\'s 韌帶', en: 'Berry\'s Ligament', cat: 'landmark', imp: 'critical', descZh: '甲狀腺與氣管的固定韌帶，返喉神經常在此處進入喉部', descEn: 'Ligament fixing thyroid to trachea, RLN often enters larynx here' },
    ]);

    // ----------------------------------------------------------------
    // 5. 腹腔鏡結腸切除術
    // ----------------------------------------------------------------
    addProcedure('大腸直腸外科', {
      zh: '腹腔鏡右半結腸切除術', en: 'Laparoscopic Right Hemicolectomy',
      descZh: '切除右半結腸（盲腸至橫結腸肝彎），適用於右側結腸腫瘤。', descEn: 'Removal of right colon (cecum to hepatic flexure), indicated for right-sided colon tumors.',
      diff: 'advanced', durMin: 90, durMax: 240, icd: '45.73'
    }, [
      { zh: '探查與評估', en: 'Exploration & Assessment', descZh: '腹腔鏡探查腹腔，評估腫瘤位置和是否有轉移', descEn: 'Laparoscopic exploration, assess tumor location and metastasis', keyZh: '確認腫瘤可切除性', keyEn: 'Confirm tumor resectability', dur: 10 },
      { zh: '中央血管優先結紮（CME）', en: 'Central Vascular Ligation (CME)', descZh: '在腸繫膜上動脈根部結紮迴結腸動脈、右結腸動脈', descEn: 'Ligate ileocolic and right colic arteries at their origins from SMA', keyZh: '完整腸繫膜切除（CME）原則', keyEn: 'Complete mesocolic excision (CME) principles', dur: 20 },
      { zh: '內側至外側剝離', en: 'Medial-to-Lateral Dissection', descZh: '沿 Toldt\'s fascia 從內側向外側剝離腸繫膜', descEn: 'Dissect mesentery medial to lateral along Toldt\'s fascia', keyZh: '保護十二指腸、右輸尿管和性腺血管', keyEn: 'Protect duodenum, right ureter, and gonadal vessels', dur: 30 },
      { zh: '肝彎游離', en: 'Hepatic Flexure Mobilization', descZh: '游離結腸肝彎，分離大網膜與橫結腸的附著', descEn: 'Mobilize hepatic flexure, separate omental attachments from transverse colon', keyZh: '小心十二指腸第二部', keyEn: 'Caution with second part of duodenum', dur: 20 },
      { zh: '體外吻合', en: 'Extracorporeal Anastomosis', descZh: '經臍部小切口將腸段拉出體外，切除腫瘤段並行迴腸-橫結腸吻合', descEn: 'Exteriorize bowel through umbilical incision, resect tumor segment, perform ileocolic anastomosis', keyZh: '確認吻合處血供良好、無張力', keyEn: 'Ensure good blood supply and no tension at anastomosis', dur: 30 },
    ], [
      { zh: '腹腔鏡', en: 'Laparoscope', cat: 'optical', essential: 1 },
      { zh: '超音波刀', en: 'Harmonic Scalpel', cat: 'energy', essential: 1 },
      { zh: '血管夾', en: 'Vascular Clips (Hem-o-lok)', cat: 'hemostasis', essential: 1 },
      { zh: '線性釘合器', en: 'Linear Stapler', cat: 'stapling', essential: 1 },
      { zh: '傷口保護套', en: 'Wound Protector', cat: 'access', essential: 1 },
    ], [
      { zh: '盲腸', en: 'Cecum', cat: 'organ', imp: 'critical', descZh: '大腸起始部', descEn: 'Beginning of large intestine' },
      { zh: '升結腸', en: 'Ascending Colon', cat: 'organ', imp: 'critical', descZh: '從盲腸到肝彎的結腸段', descEn: 'Colon segment from cecum to hepatic flexure' },
      { zh: '迴結腸動脈', en: 'Ileocolic Artery', cat: 'vessel', imp: 'critical', descZh: '腸繫膜上動脈的分支', descEn: 'Branch of superior mesenteric artery' },
      { zh: '腸繫膜上動脈', en: 'Superior Mesenteric Artery (SMA)', cat: 'vessel', imp: 'critical', descZh: '供應中腸的主要動脈', descEn: 'Major artery supplying the midgut' },
      { zh: '右輸尿管', en: 'Right Ureter', cat: 'structure', imp: 'high', descZh: '位於後腹膜，剝離時需保護', descEn: 'Retroperitoneal structure, must protect during dissection' },
      { zh: '十二指腸', en: 'Duodenum', cat: 'organ', imp: 'high', descZh: '位於右結腸後方，剝離時需避免損傷', descEn: 'Located behind right colon, avoid injury during dissection' },
      { zh: 'Toldt\'s 筋膜', en: 'Toldt\'s Fascia', cat: 'landmark', imp: 'high', descZh: '腸繫膜與後腹膜之間的融合筋膜，是正確的剝離面', descEn: 'Fusion fascia between mesentery and retroperitoneum, correct dissection plane' },
    ]);

    // ----------------------------------------------------------------
    // 6. 腹腔鏡胃袖狀切除術 (代謝手術)
    // ----------------------------------------------------------------
    addProcedure('胃腸外科', {
      zh: '腹腔鏡胃袖狀切除術', en: 'Laparoscopic Sleeve Gastrectomy',
      descZh: '切除約 80% 的胃，保留袖狀胃管，是最常見的減重代謝手術。', descEn: 'Remove approximately 80% of stomach, preserving a sleeve-shaped gastric tube. Most common bariatric procedure.',
      diff: 'advanced', durMin: 60, durMax: 120, icd: '43.82'
    }, [
      { zh: '胃大彎游離', en: 'Greater Curvature Mobilization', descZh: '從幽門前 4-6cm 開始，沿胃大彎分離大網膜直到 His 角', descEn: 'Starting 4-6cm proximal to pylorus, divide omentum along greater curvature to angle of His', keyZh: '保護脾臟和胃短動脈', keyEn: 'Protect spleen and short gastric vessels', dur: 30 },
      { zh: '胃後壁分離', en: 'Posterior Gastric Wall Dissection', descZh: '完全游離胃底與左橫膈腳的附著', descEn: 'Completely free fundus from left crus of diaphragm', keyZh: '確保 His 角完全游離以避免殘留胃底', keyEn: 'Ensure complete mobilization at His angle to avoid residual fundus', dur: 10 },
      { zh: '胃管校準與切除', en: 'Gastric Tube Calibration & Resection', descZh: '沿 36-40Fr 胃管以線性釘合器縱向切除胃大彎側', descEn: 'Perform longitudinal resection along 36-40Fr bougie using linear stapler', keyZh: '避免狹窄（不要太靠近小彎）和滲漏（釘合線重疊處）', keyEn: 'Avoid stricture (not too close to lesser curvature) and leak (staple line overlap)', dur: 20 },
      { zh: '釘合線處理與取出', en: 'Staple Line Reinforcement & Specimen Retrieval', descZh: '可考慮釘合線加強縫合，取出切除的胃組織', descEn: 'Consider staple line reinforcement suturing, retrieve resected stomach', keyZh: '測漏試驗確認無滲漏', keyEn: 'Perform leak test to confirm no leakage', dur: 10 },
    ], [
      { zh: '腹腔鏡', en: 'Laparoscope', cat: 'optical', essential: 1 },
      { zh: '超音波刀', en: 'Harmonic Scalpel / LigaSure', cat: 'energy', essential: 1 },
      { zh: '線性釘合器（60mm）', en: 'Linear Stapler 60mm', cat: 'stapling', essential: 1 },
      { zh: '胃管（36-40Fr）', en: 'Bougie 36-40Fr', cat: 'calibration', essential: 1 },
      { zh: '取物袋', en: 'Specimen Retrieval Bag', cat: 'retrieval', essential: 1 },
    ], [
      { zh: '胃', en: 'Stomach', cat: 'organ', imp: 'critical', descZh: '消化器官，手術切除大彎側約80%', descEn: 'Digestive organ, ~80% of greater curvature side resected' },
      { zh: '胃大彎', en: 'Greater Curvature', cat: 'landmark', imp: 'critical', descZh: '胃的外側彎曲', descEn: 'Outer curvature of the stomach' },
      { zh: '幽門', en: 'Pylorus', cat: 'landmark', imp: 'critical', descZh: '胃與十二指腸的交界', descEn: 'Junction between stomach and duodenum' },
      { zh: 'His 角', en: 'Angle of His', cat: 'landmark', imp: 'critical', descZh: '食道與胃底的交角', descEn: 'Angle between esophagus and gastric fundus' },
      { zh: '胃短動脈', en: 'Short Gastric Arteries', cat: 'vessel', imp: 'high', descZh: '脾動脈分支，供應胃底', descEn: 'Branches from splenic artery supplying fundus' },
      { zh: '脾臟', en: 'Spleen', cat: 'organ', imp: 'high', descZh: '位於胃底外側，游離時需小心', descEn: 'Located lateral to fundus, caution during mobilization' },
    ]);

  }); // end transaction

  seed();
}
