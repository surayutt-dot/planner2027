// ==========================================================================
// Daily Cute Mascot Module (การ์ตูนน่ารักเปลี่ยนตามวัน)
// ==========================================================================

const DAILY_MASCOTS = [
  {
    id: 'cat',
    name: 'น้องแมวส้ม โคโค่ 🐱',
    quote: 'ขอให้เป็นวันที่สดใส มีพลัง และเต็มไปด้วยรอยยิ้มนะเหมียว~',
    color: '#FFEDD5',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Cat ears -->
      <polygon points="25,48 40,12 55,42" fill="#FB923C"/>
      <polygon points="30,42 42,20 50,38" fill="#F472B6"/>
      <polygon points="95,48 80,12 65,42" fill="#FB923C"/>
      <polygon points="90,42 78,20 70,38" fill="#F472B6"/>
      <!-- Body & Head -->
      <ellipse cx="60" cy="65" rx="42" ry="38" fill="#FDBA74"/>
      <!-- Stripes -->
      <path d="M54,32 L60,42 L66,32" stroke="#EA580C" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Cheeks -->
      <circle cx="36" cy="72" r="7" fill="#FDA4AF" opacity="0.8"/>
      <circle cx="84" cy="72" r="7" fill="#FDA4AF" opacity="0.8"/>
      <!-- Eyes -->
      <ellipse cx="44" cy="62" rx="4" ry="6" fill="#1E293B"/>
      <circle cx="45" cy="59" r="1.5" fill="#FFFFFF"/>
      <ellipse cx="76" cy="62" rx="4" ry="6" fill="#1E293B"/>
      <circle cx="77" cy="59" r="1.5" fill="#FFFFFF"/>
      <!-- Nose & Mouth -->
      <polygon points="57,69 63,69 60,73" fill="#E11D48"/>
      <path d="M55,75 Q60,79 65,75" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Whiskers -->
      <line x1="22" y1="66" x2="35" y2="68" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="74" x2="34" y2="73" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
      <line x1="98" y1="66" x2="85" y2="68" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="74" x2="86" y2="73" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
      <!-- Paws -->
      <ellipse cx="45" cy="98" rx="10" ry="7" fill="#FED7AA"/>
      <ellipse cx="75" cy="98" rx="10" ry="7" fill="#FED7AA"/>
    </svg>`
  },
  {
    id: 'bunny',
    name: 'น้องกระต่าย บับเบิ้ล 🐰',
    quote: 'วันนี้ทำเต็มที่เลยนะคนเก่ง กระต่ายน้อยคอยส่งกำลังใจให้!',
    color: '#FCE7F3',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Ears -->
      <ellipse cx="42" cy="30" rx="10" ry="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      <ellipse cx="42" cy="30" rx="5" ry="18" fill="#F472B6"/>
      <ellipse cx="78" cy="30" rx="10" ry="26" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      <ellipse cx="78" cy="30" rx="5" ry="18" fill="#F472B6"/>
      <!-- Head -->
      <ellipse cx="60" cy="70" rx="38" ry="34" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      <!-- Cheeks -->
      <circle cx="38" cy="76" r="8" fill="#FBCFE8"/>
      <circle cx="82" cy="76" r="8" fill="#FBCFE8"/>
      <!-- Eyes -->
      <circle cx="46" cy="66" r="4.5" fill="#1E293B"/>
      <circle cx="47.5" cy="64" r="1.5" fill="#FFFFFF"/>
      <circle cx="74" cy="66" r="4.5" fill="#1E293B"/>
      <circle cx="75.5" cy="64" r="1.5" fill="#FFFFFF"/>
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="72" rx="3" ry="2.5" fill="#FB7185"/>
      <path d="M56,76 Q60,80 64,76" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Flower on ear -->
      <circle cx="34" cy="50" r="6" fill="#FDE047"/>
      <circle cx="34" cy="50" r="3" fill="#F97316"/>
    </svg>`
  },
  {
    id: 'bear',
    name: 'น้องหมี ช็อกโก้ 🐻',
    quote: 'เหนื่อยก็แวะพักได้นะ ทุกอย่างจะผ่านไปด้วยดี อุ่นใจเสมอ!',
    color: '#FEF3C7',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Ears -->
      <circle cx="32" cy="38" r="14" fill="#B45309"/>
      <circle cx="32" cy="38" r="7" fill="#FDE68A"/>
      <circle cx="88" cy="38" r="14" fill="#B45309"/>
      <circle cx="88" cy="38" r="7" fill="#FDE68A"/>
      <!-- Head -->
      <circle cx="60" cy="68" r="38" fill="#D97706"/>
      <!-- Muzzle -->
      <ellipse cx="60" cy="76" rx="16" ry="12" fill="#FEF3C7"/>
      <!-- Cheeks -->
      <circle cx="36" cy="72" r="6" fill="#F87171" opacity="0.7"/>
      <circle cx="84" cy="72" r="6" fill="#F87171" opacity="0.7"/>
      <!-- Eyes -->
      <circle cx="46" cy="62" r="4" fill="#1E293B"/>
      <circle cx="47" cy="60" r="1.2" fill="#FFFFFF"/>
      <circle cx="74" cy="62" r="4" fill="#1E293B"/>
      <circle cx="75" cy="60" r="1.2" fill="#FFFFFF"/>
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="72" rx="4.5" ry="3.5" fill="#451A03"/>
      <path d="M57,78 Q60,82 63,78" stroke="#451A03" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`
  },
  {
    id: 'shiba',
    name: 'น้องชิบะ นำโชค 🐕',
    quote: 'โฮ่ง! วันนี้รับรองว่ามีเรื่องดีๆ เกิดขึ้นแน่นอน ลุยเลย!',
    color: '#FFEDD5',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Ears -->
      <polygon points="25,50 36,18 56,42" fill="#D97706"/>
      <polygon points="32,44 38,26 50,38" fill="#FEF3C7"/>
      <polygon points="95,50 84,18 64,42" fill="#D97706"/>
      <polygon points="88,44 82,26 70,38" fill="#FEF3C7"/>
      <!-- Head -->
      <ellipse cx="60" cy="66" rx="40" ry="36" fill="#F59E0B"/>
      <!-- White Face Pattern -->
      <path d="M34,80 Q40,55 60,62 Q80,55 86,80 Q74,98 60,98 Q46,98 34,80 Z" fill="#FFFFFF"/>
      <!-- Eyebrow white dots -->
      <ellipse cx="44" cy="52" rx="3.5" ry="2.5" fill="#FFFFFF"/>
      <ellipse cx="76" cy="52" rx="3.5" ry="2.5" fill="#FFFFFF"/>
      <!-- Eyes -->
      <circle cx="45" cy="63" r="4" fill="#1E293B"/>
      <circle cx="46.5" cy="61.5" r="1.5" fill="#FFFFFF"/>
      <circle cx="75" cy="63" r="4" fill="#1E293B"/>
      <circle cx="76.5" cy="61.5" r="1.5" fill="#FFFFFF"/>
      <!-- Nose & Mouth -->
      <polygon points="57,72 63,72 60,76" fill="#1E293B"/>
      <path d="M55,78 Q60,82 65,78" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Cheeks -->
      <circle cx="34" cy="74" r="6" fill="#FDA4AF"/>
      <circle cx="86" cy="74" r="6" fill="#FDA4AF"/>
    </svg>`
  },
  {
    id: 'penguin',
    name: 'น้องเพนกวิน โปโป้ 🐧',
    quote: 'ก้าวไปทีละก้าว เหมือนเพนกวินเดินเตาะแตะ เดี๋ยวก็ถึงเป้าหมาย!',
    color: '#E0F2FE',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Body -->
      <ellipse cx="60" cy="68" rx="36" ry="40" fill="#1E293B"/>
      <!-- Belly -->
      <ellipse cx="60" cy="74" rx="26" ry="30" fill="#FFFFFF"/>
      <!-- Wings -->
      <ellipse cx="22" cy="72" rx="7" ry="18" fill="#1E293B" transform="rotate(15 22 72)"/>
      <ellipse cx="98" cy="72" rx="7" ry="18" fill="#1E293B" transform="rotate(-15 98 72)"/>
      <!-- Cheeks -->
      <circle cx="40" cy="70" r="5" fill="#FDA4AF"/>
      <circle cx="80" cy="70" r="5" fill="#FDA4AF"/>
      <!-- Eyes -->
      <circle cx="46" cy="58" r="4" fill="#1E293B"/>
      <circle cx="47" cy="56" r="1.5" fill="#FFFFFF"/>
      <circle cx="74" cy="58" r="4" fill="#1E293B"/>
      <circle cx="75" cy="56" r="1.5" fill="#FFFFFF"/>
      <!-- Beak -->
      <polygon points="54,66 66,66 60,73" fill="#F97316"/>
      <!-- Scarf -->
      <rect x="36" y="80" width="48" height="10" rx="5" fill="#EF4444"/>
      <rect x="66" y="80" width="10" height="20" rx="4" fill="#EF4444"/>
      <!-- Feet -->
      <ellipse cx="48" cy="106" rx="8" ry="5" fill="#F97316"/>
      <ellipse cx="72" cy="106" rx="8" ry="5" fill="#F97316"/>
    </svg>`
  },
  {
    id: 'panda',
    name: 'น้องแพนด้า ไป๋ไป๋ 🐼',
    quote: 'กินให้อิ่ม นอนให้หลับ ยิ้มให้กว้างๆ แล้วใจจะเบาสบาย~',
    color: '#F1F5F9',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Ears -->
      <circle cx="30" cy="36" r="14" fill="#0F172A"/>
      <circle cx="90" cy="36" r="14" fill="#0F172A"/>
      <!-- Head -->
      <circle cx="60" cy="68" r="38" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      <!-- Eye patches -->
      <ellipse cx="42" cy="64" rx="10" ry="12" fill="#0F172A" transform="rotate(-15 42 64)"/>
      <ellipse cx="78" cy="64" rx="10" ry="12" fill="#0F172A" transform="rotate(15 78 64)"/>
      <!-- Eyes -->
      <circle cx="43" cy="63" r="3" fill="#FFFFFF"/>
      <circle cx="77" cy="63" r="3" fill="#FFFFFF"/>
      <!-- Cheeks -->
      <circle cx="34" cy="76" r="6" fill="#FDA4AF"/>
      <circle cx="86" cy="76" r="6" fill="#FDA4AF"/>
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="74" rx="5" ry="3.5" fill="#0F172A"/>
      <path d="M57,80 Q60,84 63,80" stroke="#0F172A" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`
  },
  {
    id: 'dino',
    name: 'น้องไดโน จูเนียร์ 🦖',
    quote: 'วันนี้เราตัวเล็ก แต่หัวใจและความพยายามเรายิ่งใหญ่มาก!',
    color: '#DCFCE7',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Spikes -->
      <polygon points="55,14 62,26 69,14" fill="#15803D"/>
      <polygon points="70,20 77,32 84,20" fill="#15803D"/>
      <polygon points="82,30 90,42 96,30" fill="#15803D"/>
      <!-- Head -->
      <ellipse cx="58" cy="66" rx="38" ry="36" fill="#4ADE80"/>
      <!-- Cheeks -->
      <circle cx="36" cy="74" r="6" fill="#F87171" opacity="0.8"/>
      <circle cx="82" cy="74" r="6" fill="#F87171" opacity="0.8"/>
      <!-- Eyes -->
      <circle cx="45" cy="58" r="4.5" fill="#1E293B"/>
      <circle cx="46.5" cy="56" r="1.5" fill="#FFFFFF"/>
      <circle cx="75" cy="58" r="4.5" fill="#1E293B"/>
      <circle cx="76.5" cy="56" r="1.5" fill="#FFFFFF"/>
      <!-- Nostrils -->
      <circle cx="56" cy="68" r="1.8" fill="#166534"/>
      <circle cx="64" cy="68" r="1.8" fill="#166534"/>
      <!-- Smile -->
      <path d="M50,78 Q60,86 70,78" stroke="#166534" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Cute star on head -->
      <polygon points="34,30 36,36 42,36 37,40 39,46 34,42 29,46 31,40 26,36 32,36" fill="#FACC15"/>
    </svg>`
  },
  {
    id: 'frog',
    name: 'น้องกบ เคโระ 🐸',
    quote: 'กระโดดข้ามทุกอุปสรรคได้อย่างสวยงาม ลุยเลยเคโระ!',
    color: '#D1FAE5',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Eye bumps -->
      <circle cx="36" cy="40" r="16" fill="#34D399"/>
      <circle cx="84" cy="40" r="16" fill="#34D399"/>
      <circle cx="36" cy="40" r="11" fill="#FFFFFF"/>
      <circle cx="84" cy="40" r="11" fill="#FFFFFF"/>
      <circle cx="36" cy="40" r="5" fill="#065F46"/>
      <circle cx="37" cy="38" r="1.5" fill="#FFFFFF"/>
      <circle cx="84" cy="40" r="5" fill="#065F46"/>
      <circle cx="85" cy="38" r="1.5" fill="#FFFFFF"/>
      <!-- Face -->
      <ellipse cx="60" cy="70" rx="42" ry="32" fill="#34D399"/>
      <!-- Cheeks -->
      <circle cx="32" cy="74" r="7" fill="#F472B6" opacity="0.8"/>
      <circle cx="88" cy="74" r="7" fill="#F472B6" opacity="0.8"/>
      <!-- Smile -->
      <path d="M44,72 Q60,88 76,72" stroke="#065F46" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Lotus Leaf Hat -->
      <ellipse cx="60" cy="22" rx="20" ry="6" fill="#059669"/>
      <line x1="60" y1="22" x2="60" y2="12" stroke="#047857" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'chick',
    name: 'น้องลูกเจี๊ยบ ปิ๊บปิ๊บ 🐥',
    quote: 'ตื่นเช้ามาพบความสุขตัวกระจิริด ขอให้วันนี้สดใสทั้งวันนะ!',
    color: '#FEF08A',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Head/Body -->
      <circle cx="60" cy="65" r="38" fill="#FDE047"/>
      <!-- Tuft of hair -->
      <path d="M57,28 Q60,18 63,28 Q66,16 70,28" stroke="#EAB308" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Cheeks -->
      <circle cx="36" cy="72" r="6" fill="#FB923C" opacity="0.8"/>
      <circle cx="84" cy="72" r="6" fill="#FB923C" opacity="0.8"/>
      <!-- Eyes -->
      <circle cx="45" cy="60" r="4.5" fill="#1E293B"/>
      <circle cx="46.5" cy="58" r="1.5" fill="#FFFFFF"/>
      <circle cx="75" cy="60" r="4.5" fill="#1E293B"/>
      <circle cx="76.5" cy="58" r="1.5" fill="#FFFFFF"/>
      <!-- Beak -->
      <polygon points="54,66 66,66 60,74" fill="#F97316"/>
      <!-- Wings -->
      <ellipse cx="24" cy="68" rx="6" ry="12" fill="#FACC15" transform="rotate(20 24 68)"/>
      <ellipse cx="96" cy="68" rx="6" ry="12" fill="#FACC15" transform="rotate(-20 96 68)"/>
    </svg>`
  },
  {
    id: 'hamster',
    name: 'น้องแฮมสเตอร์ โมจิ 🐹',
    quote: 'กักเก็บความสุขไว้เต็มกระพุ้งแก้ม แล้วส่งต่อพลังบวกให้ทุกคนนะ!',
    color: '#FED7AA',
    svg: `<svg viewBox="0 0 120 120" width="100%" height="100%">
      <!-- Ears -->
      <circle cx="34" cy="34" r="12" fill="#FDBA74"/>
      <circle cx="34" cy="34" r="7" fill="#F472B6"/>
      <circle cx="86" cy="34" r="12" fill="#FDBA74"/>
      <circle cx="86" cy="34" r="7" fill="#F472B6"/>
      <!-- Big Chubby Cheeks -->
      <circle cx="36" cy="75" r="22" fill="#FFFFFF"/>
      <circle cx="84" cy="75" r="22" fill="#FFFFFF"/>
      <!-- Head Base -->
      <ellipse cx="60" cy="64" rx="34" ry="32" fill="#FB923C"/>
      <ellipse cx="60" cy="76" rx="20" ry="18" fill="#FFFFFF"/>
      <!-- Cheeks blush -->
      <circle cx="28" cy="76" r="6" fill="#FDA4AF"/>
      <circle cx="92" cy="76" r="6" fill="#FDA4AF"/>
      <!-- Eyes -->
      <circle cx="44" cy="58" r="4" fill="#1E293B"/>
      <circle cx="45" cy="56" r="1.2" fill="#FFFFFF"/>
      <circle cx="76" cy="58" r="4" fill="#1E293B"/>
      <circle cx="77" cy="56" r="1.2" fill="#FFFFFF"/>
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="66" rx="3.5" ry="2.5" fill="#E11D48"/>
      <path d="M57,71 Q60,75 63,71" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Sunflower seed held -->
      <ellipse cx="60" cy="88" rx="6" ry="10" fill="#78350F" transform="rotate(-15 60 88)"/>
      <ellipse cx="60" cy="88" rx="3" ry="8" fill="#B45309" transform="rotate(-15 60 88)"/>
    </svg>`
  }
];

// Returns the mascot of the day based on date
function getMascotForDate(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const idx = Math.abs(dayOfYear) % DAILY_MASCOTS.length;
  return DAILY_MASCOTS[idx];
}
