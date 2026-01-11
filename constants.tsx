
import { DaySchedule } from './types.ts';
import { IMAGES } from './assets.ts';

export const PARENT_RULES = [
  "아직 멀었냐 금지",
  "줄 계속 서야되냐 금지",
  "이 돈이면 집에서 해먹는 게 낫다 금지",
  "이거 무슨 맛으로 먹냐 금지",
  "돈 아깝다 금지",
  "말없이 혼자 사라지기 금지",
  "여기 젊은 애들이나 오는 데 아니냐 금지",
  "쇼핑하러 가서 눈치주기 금지",
  "겨우 이거 보러왔냐 금지",
  "다른 사람 가리키며 삿대질 금지"
];

export const SIBLING_RULES = [
  "사진 다시 찍어줘 금지",
  "밥먹을 때 핸드폰 하기 금지",
  "말할 때 욕 섞어서 말하기 금지",
  "똑같은 거 물어본다고 짜증내기 금지",
  "못 알아 듣는 줄임말 금지",
  "외출 시간 지키기 (지각 금지)",
  "엄마/아빠는 몰라도 돼 금지",
  "과음 금지",
  "아 원래 이런거야 금지 (설명 생략 금지)",
  "다시는 같이 여행 안올거야 금지"
];

// 이전 버전과의 호환성을 위해 남겨두되, 실제 뷰에서는 위 상수를 사용합니다.
export const TRIP_RULES = [...PARENT_RULES, ...SIBLING_RULES];

const linkStyle = "color: #1675F2; text-decoration: underline; font-weight: 700;";

export const SCHEDULE_DATA: { title: string; days: DaySchedule[] } = {
  title: "2026 오사카/교토 가족 여행",
  days: [
    {
      label: "정보",
      items: [
        {
          title: "비행 정보",
          transport: 'flight',
          note: "• 인천 → 오사카 (RF314)\n• 오사카 → 인천 (TW306)",
          noImage: true
        },
        {
          title: "Visit Japan Web (입국 수속)",
          note: `• <a href='https://services.digital.go.jp/ko/visit-japan-web/' target='_blank' style='${linkStyle}'>비짓재팬 공식 홈페이지</a>\n• <a href='https://blog.naver.com/leeleeworks/224034184611' target='_blank' style='${linkStyle}'>비짓재팬 등록 방법 가이드</a>`,
          noImage: true
        },
        {
          title: "일본 체류지 정보 (호텔)",
          note: "• 우편번호: 542-0074\n• 호텔명: kamon-hotel\n• 주소: 2 Chome-3-33 Sennichimae, Chuo Ward, Osaka, 542-0074 일본\n• 연락처: +81 6 6632 3520",
          mapUrl: "https://maps.app.goo.gl/SuSzkceFCajWgMCU9",
          noImage: true
        },
        {
          title: "오사카 공항 수속 방법",
          note: `• <a href='https://blog.naver.com/leeleeworks/224135084112' target='_blank' style='${linkStyle}'>공항 수속 절차 상세보기</a>`,
          noImage: true
        }
      ]
    },
    {
      label: "1일차",
      items: [
        {
          time: "16:30",
          title: "인천공항 제1터미널 집합",
          note: "• 선발대: 영수, 한나, 아라 / 후발대: 연실, 유나, 건\n• 스마트패스 티켓 및 이심 등록\n• Visit Japan Web QR 미리 캡처",
          noImage: true
        },
        {
          time: "19:25 - 21:15",
          title: "인천 -> 오사카(KIX)",
          transport: 'flight',
          note: "• 입국 심사 준비 (Visit Japan Web QR)",
          noImage: true
        },
        {
          time: "21:15 - 22:30",
          title: "카몬 호텔 난바",
          transport: 'train',
          note: `• <a href='https://blog.naver.com/bbh4313/224127071321' target='_blank' style='${linkStyle}'>ATM 위치 확인하기</a>\n• 라피트 막차 시간 : 22시 55분`,
          mapUrl: "https://maps.app.goo.gl/SuSzkceFCajWgMCU9"
        },
        {
          time: "22:30",
          title: "카몬 호텔 난바 도착",
          image: IMAGES.camonhotel,
          note: "• 체크인 및 짐 풀기",
          expectedCost: "숙박세: 인당 ¥200",
          mapUrl: "https://maps.app.goo.gl/SuSzkceFCajWgMCU9"
        },
        {
          time: "참고",
          title: "카몬 호텔 예약확정서",
          pdfUrl: "https://drive.google.com/file/d/1aXW2qPUkb1XpMIQ5lNE-VyYKsImkg_1t/view?usp=sharing",
          noImage: true
        }
      ]
    },
    {
      label: "2일차",
      items: [
        {
          time: "06:30 - 08:00",
          title: "기상 & 준비",
          noImage: true
        },
        {
          time: "08:00 - 09:30",
          title: "난바역 교토역",
          transport: 'train',
          mapUrl: "https://maps.app.goo.gl/gs3ecQuG4mdBi7oq5",
          expectedCost: "교통비: ¥820 (신쾌속)",
          note: `• 신쾌속 08:56편 출발\n• JR 신쾌속 소요시간 : 약 30분\n• <a href="https://www.jorudan.co.jp/time/to/%E4%BA%AC%E9%83%BD_%E5%A4%A7%E9%98%AA/?Dym=202602&Ddd=18&r=%EF%BC%AA%EF%BC%B2%E4%BA%AC%E9%83%BD%E7%B7%9A" target="_blank" style='${linkStyle}'>신쾌속 시간표 보기</a>`,
          noImage: true
        },
        {
          time: "09:30 - 10:00",
          title: "호텔 체크인", 
          image: IMAGES.rinn_kujo,
          mapUrl: "https://maps.app.goo.gl/5G3xC3bxrmSEVxULA",
          expectedCost: "숙박세: ¥400",
          note: "• Rinn Kujofujinoki Central"
        },
        {
          time: "참고",
          title: "교토 호텔 예약확정서",
          pdfUrl: "https://drive.google.com/file/d/1WbIrycFTZzf53lJj2hmJQBtFAwic6ZXV/view?usp=sharing",
          noImage: true
        },
        {
          time: "10:30 - 11:00",
          title: "타이쇼 하나나",
          transport: 'train',
          mapUrl: "https://maps.app.goo.gl/fauUxg3ejMhf2pWj7",
          expectedCost: "교통비: ¥240",
          noImage: true
        },
        {
          time: "11:00 - 12:00",
          title: "타이쇼 하나나 식사",
          image: IMAGES.hanana,
          note: `• 현금결제만 가능\n• <a href='https://blog.naver.com/jiyoo9697/223874041269' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>식당 정보 상세보기</a>`
        },
        {
          time: "12:00 - 14:30",
          title: "아라시야마",
          image: IMAGES.arashiyama,
          mapUrl: "https://maps.app.goo.gl/7vA52RmcDKbXL8vS7",
          note: "① 아라시야마 치쿠린\n② 아라시야마 대나무길\n③ 텐류지\n④ 아라비카 교토 아라시야마점\n⑤ 도게츠 교\n⑥ 미피 사쿠라 키친\n⑦ 리락쿠마 카페\n⑧ 코토이모 본점(당고)"
        },
        {
          time: "14:30 - 15:00",
          title: "니시키 시장",
          transport: 'taxi',
          mapUrl: "https://maps.app.goo.gl/QnAwAYi3LdAShYQW6",
          expectedCost: "택시비: 약 ₩30,000",
          note: "• 택시 도착 지점은 산리오 갤러리 교토로 찍기",
          noImage: true
        },
        {
          time: "15:00 - 17:00",
          title: "니시키 시장 근처",
          image: IMAGES.nishiki_market,
          note: "[SOU・SOU 쇼핑 리스트]\n• 타비 / 이세모멘 / kikoromo\n• hotei / Okurimono / Yousou.\n\n<span style='color:#ff5a7a; font-weight: 800;'>[니시키시장 유의사항]</span>\n• 시장 내 ‘먹으면서 걷기’ 금지\n• 구입한 가게 앞/가게 안에서 시식 가능"
        },
        {
          time: "17:00 - 18:30",
          title: "레드락 스테이크 덮밥 / 장어덮밥",
          image: IMAGES.redrock,
          note: `• 레드락 : 현금결제만 가능\n• <a href='https://maps.app.goo.gl/oPyQgQeqjbsGnu8c6' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>레드락 위치 보기</a>\n• <a href='https://maps.app.goo.gl/TmYzrRZQdTyZWosg8' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>쿄우나와 위치 보기</a>`
        },
        {
          time: "18:30 - 19:30",
          title: "다이소 & StandardProducts",
          mapUrl: "https://maps.app.goo.gl/TWAKcuXMatjEMepC7",
          note: "• 각 매장 30분 시간 제한",
          noImage: true
        },
        {
          time: "19:30 - 20:00",
          title: "숙소",
          transport: 'taxi',
          expectedCost: "택시비: 약 ₩10,000",
          noImage: true
        },
        {
          time: "20:00 -",
          title: "이온몰",
          image: IMAGES.aeonmall,
          note: "• 다이소 21시 마감\n• 마켓 가든 22시 마감"
        }
      ]
    },
    {
      label: "3일차",
      items: [
        {
          time: "08:20",
          title: "준비 & 아침식사",
          noImage: true
        },
        {
          time: "08:20 - 09:00",
          title: "청수사",
          transport: 'bus',
          mapUrl: "https://maps.app.goo.gl/hLp5gqqzgsGzZ5NV6",
          expectedCost: "버스비: ¥230",
          noImage: true
        },
        {
          time: "09:00 - 12:30",
          title: "청수사, 산넨자카, 니넨자카",
          image: IMAGES.kiyomizudera,
          note: "• 청수사 입장료: ¥500, 현금만 가능\n• 청수사 근처: mochi mochi, 유바치즈, 월하미인\n\n<span style='color:#ff5a7a; font-weight: 800;'>[니넨자카 의미]</span>\n• 니넨(2년)자카(고개, 언덕)\n• 오르다 넘어지면 2년 안에 좋지 않은 일이 생긴다는 속설\n• 본래 의미는 무사함, 평안, 출산의 안녕을 기원하는 길"
        },
        {
          time: "12:30 - 13:30",
          title: "점심 京料理 花かが미",
          image: IMAGES.lunch_hanakagami,
          mapUrl: "https://maps.app.goo.gl/vJm4CRXN7cjiCfPu9",
          note: `• 예약확정: 12:30\n• 여행 2일 전 다시 이메일 드리기\n• <a href='https://www.hanakagami.co.jp/contact/' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>京料理 花かが미 홈페이지 이동</a>`
        },
        {
          time: "13:30 - 14:00",
          title: "오카페 교토",
          transport: 'walk',
          mapUrl: "https://maps.app.goo.gl/ZZRCgS4z8PbPRuC2A",
          noImage: true
        },
        {
          time: "14:00 - 15:00",
          title: "오카페 교토",
          image: IMAGES.okaffe
        },
        {
          time: "15:00 - 17:00",
          title: "문구점 투어",
          mapUrl: "https://maps.app.goo.gl/FeJypkoKBEw5My9j8",
          image: IMAGES.stationery,
          note: "① 웰더(베이커리)\n② 휴먼 메이드 1928\n③ Stationery Shop tag\n④ 규쿄도 문구\n⑤ 그란디루 오이케점\n⑥ Para lucirse\n⑦ 表現社 HIRAETH\n⑧ forme.(フォルム)\n⑨ 伊통문방구 (伊藤文祥堂)"
        },
        {
          time: "17:00 - 17:30",
          title: "Kaneko",
          transport: 'taxi',
          mapUrl: "https://maps.app.goo.gl/pFwxx3v1cmQZxEAG9",
          expectedCost: "택시비: 약 ₩10,000",
          noImage: true
        },
        {
          time: "17:30 - 19:00",
          title: "Kaneko",
          note: `• <a href='https://www.instagram.com/kaneko_kyoto?igsh=Nmg1Y2Q0NWljZGI3&utm_source=qr' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>인스타그램</a>`,
          images: [
            { src: IMAGES.kaneko_confirm1, alt: "Kaneko 예약확정서 1", fit: "contain" },
            { src: IMAGES.kaneko_confirm2, alt: "Kaneko 예약확정서 2", fit: "contain" }
          ]
        },
        {
          time: "19:00 - 19:30",
          title: "숙소",
          transport: 'bus',
          expectedCost: "버스비: ¥230",
          noImage: true
        },
        {
          time: "20:00 -",
          title: "센토 Hinode-yu",
          mapUrl: "https://maps.app.goo.gl/BfUAtyudWqumkp4dA",
          image: IMAGES.hinodeyu,
          note: `• 입장료: ¥550\n• <a href='https://blog.naver.com/ohihelloj/223247044183' target='_blank' rel='noopener noreferrer' style='${linkStyle}'>센토 이용 후기 상세보기</a>`
        }
      ]
    },
    {
      label: "4일차",
      items: [
        {
          time: "08:40",
          title: "기상 & 준비",
          noImage: true
        },
        {
          time: "08:40 - 09:00",
          title: "체크아웃 및 짐 맡기기",
          note: "• 유나, 현아, 건 담당",
          noImage: true
        },
        {
          time: "09:00 - 09:15",
          title: "Aoitori 이동",
          transport: 'walk',
          mapUrl: "https://maps.app.goo.gl/NEQNzji7VXbuRbr6",
          noImage: true
        },
        {
          time: "09:15 - 10:15",
          title: "Aoitori",
          image: IMAGES.aoitori
        },
        {
          time: "10:15 - 10:45",
          title: "후시미 이나리 이동",
          transport: 'train',
          mapUrl: "https://maps.app.goo.gl/HNYpFVtRGoeUhbm36",
          expectedCost: "교통비: ¥180",
          noImage: true
        },
        {
          time: "10:45 - 12:00",
          title: "후시미 이나리 신사",
          image: IMAGES.fushimi_inari,
          note: "• 사업 번창, 농업의 풍요를 기원하는 신사\n• 여우 동상: 신의 심부름꾼(다양한 버전 감상)\n• 토리이 길: 초입만 구경해도 충분함\n• 일주문을 세우면 사업이 번창한다고 해서 많은 일본의 개인, 기업가들이 후원하면서 천개에서 만개가 된 것\n\n[근처 들를 곳]\n① 치이카와 잡화점\n② Inari Futaba (콩떡)\n③ 호교쿠도 (여우 전병)"
        },
        {
          time: "12:00 - 12:30",
          title: "짐찾기",
          transport: 'train',
          expectedCost: "교통비: ¥150",
          noImage: true
        },
        {
          time: "12:30 - 13:00",
          title: "발권 및 플랫폼 이동",
          transport: 'train',
          expectedCost: "교통비: ¥820",
          noImage: true
        },
        {
          time: "13:00 - 14:00",
          title: "오사카 숙소 이동",
          transport: 'train',
          mapUrl: "https://maps.app.goo.gl/bz95UscBXsHiY78V8",
          image: IMAGES.kokohotel,
          expectedCost: "숙박세: ¥200",
          note: "• KOKO HOTEL Osaka Namba"
        },
        {
          time: "14:00 - 15:00",
          title: "스시 사카바 사시스",
          mapUrl: "https://maps.app.goo.gl/rXZAwUV6HSBmrd9z8",
          image: IMAGES.sashisu
        },
        {
          time: "15:00 - 17:00",
          title: "근처 구경",
          mapUrl: "https://maps.app.goo.gl/pBr3M4cSHDZUjmQM8",
          image: IMAGES.near_guromon,
          note: "① 구로몬 시장\n② 센니치마에 도구야스지 상점가\n③ 도톤보리 (멜론브레드 등)"
        },
        {
          time: "17:00 - 18:40",
          title: "신사이바시스지 상점가",
          image: IMAGES.shinsaibashi,
          note: "① GIGO 오사카 도톤보리\n② 러쉬 / 아디다스 / GU\n③ SHIRO / 나이키 / 아식스\n④ 다이마루 & 파르코 백화점"
        },
        {
          time: "18:40 - 19:00",
          title: "모미지 이동",
          transport: 'taxi',
          mapUrl: "https://maps.app.goo.gl/2wtQYR4rCDCtaJ3B9",
          expectedCost: "택시비: 약 ₩6,000",
          noImage: true
        },
        {
          time: "19:00 - 20:30",
          title: "오꼬노미야끼 모미지",
          image: IMAGES.momiji_reserve,
          note: "• 예약 시간: 19:15 엄수"
        },
        {
          time: "참고",
          title: "모미지 예약 관련",
          pdfUrl: "https://drive.google.com/file/d/1LTAHFP5PRnzEJceiuhp4kyEVnj4bKLZI/view?usp=drive_link",
          noImage: true
        },
        {
          time: "20:30 - 20:45",
          title: "숙소 이동",
          transport: 'walk',
          noImage: true
        },
        {
          time: "21:00 -",
          title: "드럭스토어 & 돈키호테",
          mapUrl: "https://maps.app.goo.gl/oDH2cuGY1FCjys9w9",
          image: IMAGES.donki,
          note: "• 아카카베 드럭스토어 마감: 23:30"
        }
      ]
    },
    {
      label: "5일차",
      items: [
        {
          time: "- 08:30",
          title: "기상 & 준비",
          noImage: true
        },
        {
          time: "08:30 - 10:00",
          title: "おにぎ리 松 (오니기리 마츠)",
          image: IMAGES.onigiri_matsu,
          mapUrl: "https://maps.app.goo.gl/T4Y67F1zL88K1k6S7",
          note: `• <a href='https://blog.naver.com/shyeon07/224056304937' target='_blank' style='${linkStyle}'>오니기리 마츠 상세 정보</a>`
        },
        {
          time: "10:00 - 11:00",
          title: "주변 상점가 구경",
          image: IMAGES.daiso_gigo,
          note: "• 다이소\n• 기고 난바 아비온\n• 사키모토 베이커리 카페 (소금빵, 메론빵)"
        },
        {
          time: "11:00 - 12:00",
          title: "규카츠 토미타",
          image: IMAGES.gyukatsu_tomita,
          mapUrl: "https://maps.app.goo.gl/YjC6yS8f6mC7zY9s8",
          note: `• <a href='https://blog.naver.com/gmltjs5030/224081549500' target='_blank' style='${linkStyle}'>규카츠 토미타 메뉴 및 리뷰</a>`
        },
        {
          time: "12:00 - 12:30",
          title: "오사카성 이동",
          transport: 'taxi',
          expectedCost: "택시비: 약 ₩8,000",
          noImage: true
        },
        {
          time: "12:30 - 13:45",
          title: "오사카성",
          image: IMAGES.osaka_castle,
          mapUrl: "https://maps.app.goo.gl/YjC6yS8f6mC7zY9s8"
        },
        {
          time: "13:45 - 14:00",
          title: "카페 마루후쿠 커피 이동",
          transport: 'taxi',
          expectedCost: "택시비: 약 ₩8,000",
          noImage: true
        },
        {
          time: "14:00 - 15:10",
          title: "마루후쿠 커피 센니치마에 본점",
          image: IMAGES.marufuku_coffee,
          mapUrl: "https://maps.app.goo.gl/pBr3M4cSHDZUjmQM8"
        },
        {
          time: "15:10 - 15:20",
          title: "호텔에서 짐 찾기",
          noImage: true
        },
        {
          time: "15:20 - 16:00",
          title: "오사카 공항 이동",
          transport: 'train',
          expectedCost: "라피트: 약 ₩12,000",
          noImage: true
        },
        {
          time: "19:10 - 21:05",
          title: "오사카(KIX) > 인천(ICN)",
          transport: 'flight',
          note: "• 무사히 한국 도착!",
          noImage: true
        }
      ]
    }
  ]
};
