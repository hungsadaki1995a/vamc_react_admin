export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
}

export const mockUsers: User[] = [
  { id: 'U001', name: '김영수', email: 'kim.youngsoo@ds.com', department: '개발1팀', role: '팀장' },
  { id: 'U002', name: '이미영', email: 'lee.miyoung@ds.com', department: '개발1팀', role: '선임' },
  { id: 'U003', name: '박정호', email: 'park.jungho@ds.com', department: '개발2팀', role: '팀장' },
  { id: 'U004', name: '최수진', email: 'choi.soojin@ds.com', department: '개발2팀', role: '사원' },
  { id: 'U005', name: '정민우', email: 'jung.minwoo@ds.com', department: '기획팀', role: '팀장' },
  { id: 'U006', name: '한지은', email: 'han.jieun@ds.com', department: '디자인팀', role: '선임' },
  { id: 'U007', name: '송태현', email: 'song.taehyun@ds.com', department: '개발1팀', role: '사원' },
  { id: 'U008', name: '윤서연', email: 'yoon.seoyeon@ds.com', department: 'QA팀', role: '팀장' },
  { id: 'U009', name: '임재혁', email: 'im.jaehyuk@ds.com', department: '개발2팀', role: '선임' },
  { id: 'U010', name: '오하늘', email: 'oh.haneul@ds.com', department: '기획팀', role: '사원' },
  { id: 'U011', name: '강민준', email: 'kang.minjun@ds.com', department: '개발1팀', role: '사원' },
  { id: 'U012', name: '서지훈', email: 'seo.jihoon@ds.com', department: '개발2팀', role: '사원' },
  { id: 'U013', name: '장수연', email: 'jang.sooyeon@ds.com', department: '디자인팀', role: '사원' },
  { id: 'U014', name: '배현우', email: 'bae.hyunwoo@ds.com', department: 'QA팀', role: '선임' },
  { id: 'U015', name: '조은별', email: 'jo.eunbyul@ds.com', department: '기획팀', role: '선임' },
  { id: 'U016', name: '권도현', email: 'kwon.dohyun@ds.com', department: '인프라팀', role: '팀장' },
  { id: 'U017', name: '신예진', email: 'shin.yejin@ds.com', department: '인프라팀', role: '선임' },
  { id: 'U018', name: '류승현', email: 'ryu.seunghyun@ds.com', department: '인프라팀', role: '사원' },
  { id: 'U019', name: '문지아', email: 'moon.jia@ds.com', department: '디자인팀', role: '팀장' },
  { id: 'U020', name: '홍정원', email: 'hong.jungwon@ds.com', department: 'QA팀', role: '사원' },
];

export const currentUser = mockUsers[0];
