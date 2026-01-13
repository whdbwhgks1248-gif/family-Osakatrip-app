
export type MemberId = '영수' | '연실' | '한나' | '유나' | '아라' | '현아' | '건';
export type Assignee = MemberId | '공통';

export const FAMILY_MEMBERS: MemberId[] = ['영수', '연실', '한나', '유나', '아라', '현아', '건'];
export const ASSIGNEE_OPTIONS: Assignee[] = ['공통', ...FAMILY_MEMBERS];

export interface ScheduleItem {
  time?: string;
  title: string;
  note?: string;
  expectedCost?: string;
  mapUrl?: string;
  pdfUrl?: string; // PDF 예약 확인서 링크용
  image?: string;
  images?: { src: string; alt?: string; fit?: string }[];
  noImage?: boolean; // 해당 항목에서 이미지 업로드/표시 영역을 완전히 제거할지 여부
  transport?: 'bus' | 'taxi' | 'train' | 'flight' | 'walk' | 'move'; // 이동 수단 아이콘용
}

export interface DaySchedule {
  label: string;
  items: ScheduleItem[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: MemberId;
  participantIds: MemberId[];
  settledMemberIds: MemberId[]; // Who has already sent money to the payer
  date: number;
}

export interface Souvenir {
  id: string;
  title: string;
  jpName?: string; // 일본어 상품명 (점원에게 보여주기용)
  note?: string;   // 수량, 특징 등 상세 메모
  imageUrl?: string; // 상품 이미지 URL
  linkUrl?: string;  // 참고용 링크 (새로 추가)
  isPurchased: boolean;
}

export interface PackItem {
  id: string;
  title: string;
  assignedTo: Assignee[]; // 단일 값이 아닌 배열로 변경
  isDone: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
