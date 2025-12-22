import axios from 'axios';
import FormData from 'form-data';

// Aligo API 인증 데이터
const ALIGO_API_KEY = process.env.ALIGO_API_KEY || '';
const ALIGO_USER_ID = process.env.ALIGO_USER_ID || '';
const DEFAULT_SENDER = process.env.ALIGO_SENDER || '';
const ALIGO_TESTMODE = process.env.ALIGO_TESTMODE === 'Y' ? 'Y' : undefined;

// Aligo API 기본 URL
const ALIGO_BASE_URL = 'https://apis.aligo.in';

// FormData로 POST 요청 보내기
async function postToAligo(endpoint: string, data: Record<string, any>): Promise<any> {
  const form = new FormData();

  // 인증 정보 추가
  form.append('key', ALIGO_API_KEY);
  form.append('user_id', ALIGO_USER_ID);

  // 데이터 추가
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  }

  // 디버그 로그
  console.log(`[Aligo API] ${endpoint}`, {
    key: ALIGO_API_KEY ? `${ALIGO_API_KEY.substring(0, 4)}...` : '(empty)',
    user_id: ALIGO_USER_ID,
    testmode_yn: data.testmode_yn,
    ...data,
  });

  try {
    const response = await axios.post(`${ALIGO_BASE_URL}${endpoint}`, form, {
      headers: form.getHeaders(),
    });
    console.log(`[Aligo API Response]`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Aligo API error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

export interface SmsSendParams {
  sender?: string;
  receiver: string;
  msg: string;
  msg_type?: 'SMS' | 'LMS' | 'MMS';
  title?: string;
  destination?: string;
  rdate?: string;
  rtime?: string;
  testmode_yn?: 'Y' | 'N';
}

export interface SmsSendMassParams {
  sender?: string;
  messages: Array<{
    receiver: string;
    msg: string;
  }>;
  msg_type: 'SMS' | 'LMS' | 'MMS';
  title?: string;
  rdate?: string;
  rtime?: string;
  testmode_yn?: 'Y' | 'N';
}

export interface SmsListParams {
  page?: number;
  page_size?: number;
  start_date?: string;
  limit_day?: number;
}

export interface SmsDetailParams {
  mid: string;
  page?: number;
  page_size?: number;
}

// 단일/동일내용 문자 발송
export async function sendSms(params: SmsSendParams): Promise<any> {
  return postToAligo('/send/', {
    sender: params.sender || DEFAULT_SENDER,
    receiver: params.receiver,
    msg: params.msg,
    msg_type: params.msg_type,
    title: params.title,
    destination: params.destination,
    rdate: params.rdate,
    rtime: params.rtime,
    testmode_yn: params.testmode_yn ?? ALIGO_TESTMODE,
  });
}

// 대량 문자 발송 (각각 다른 내용)
export async function sendSmsMass(params: SmsSendMassParams): Promise<any> {
  const data: Record<string, any> = {
    sender: params.sender || DEFAULT_SENDER,
    msg_type: params.msg_type,
    title: params.title,
    cnt: params.messages.length,
    rdate: params.rdate,
    rtime: params.rtime,
    testmode_yn: params.testmode_yn ?? ALIGO_TESTMODE,
  };

  // rec_1, msg_1, rec_2, msg_2, ... 형식으로 추가
  params.messages.forEach((m, index) => {
    data[`rec_${index + 1}`] = m.receiver;
    data[`msg_${index + 1}`] = m.msg;
  });

  return postToAligo('/send_mass/', data);
}

// 전송내역 조회
export async function getSmsHistory(params: SmsListParams): Promise<any> {
  return postToAligo('/list/', {
    page: params.page || 1,
    page_size: params.page_size || 30,
    start_date: params.start_date,
    limit_day: params.limit_day,
  });
}

// 전송결과 상세 조회
export async function getSmsDetail(params: SmsDetailParams): Promise<any> {
  return postToAligo('/sms_list/', {
    mid: params.mid,
    page: params.page || 1,
    page_size: params.page_size || 30,
  });
}

// 발송가능 건수 조회
export async function getSmsRemain(): Promise<any> {
  return postToAligo('/remain/', {});
}

// 예약 취소
export async function cancelSms(mid: string): Promise<any> {
  return postToAligo('/cancel/', { mid });
}
