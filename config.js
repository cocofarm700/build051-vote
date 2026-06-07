// Google Form 연동 설정.
const CONFIG = {
  // 폼 주소 (?usp=pp_url 까지). 폼 ID만 바뀌지 않으면 그대로 둡니다.
  formBaseUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLScvoIzBhsFFcd8TGhkX3Hgdbu6lVLDGbSySDs0I1IYSNLmaDg/viewform?usp=pp_url",
  // 부문별 객관식 질문의 entry ID.
  entryIds: {
    corporate: "entry.349499540",   // 기업 부문 (선택지 25개)
    student: "entry.573653080",     // 학생 부문 (선택지 25개)
    innovation: "entry.2083454847", // 혁신 부문 (선택지 50개)
  },
};
