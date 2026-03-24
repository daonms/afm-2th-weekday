// 1. HTML 요소 가져오기
const birthday = document.getElementById('birthday');
const calcBtn = document.getElementById('calcBtn');
const result = document.getElementById('result');
const age = document.getElementById('age');

// 2. 버튼 클릭 이벤트 등록
calcBtn.addEventListener('click', function () {

    // 3. 입력값 확인
    if (!birthday.value) {
        alert('생년월일을 입력해주세요!');
        return;
    }

    // 4. 만 나이 계산
    const today = new Date();
    const birth = new Date(birthday.value);

    let myAge = today.getFullYear() - birth.getFullYear();

    // 생일이 아직 안 지났으면 1살 빼기
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        myAge--;
    }

    // 5. 결과 표시
    age.textContent = myAge;
    result.classList.remove('hidden');
});
