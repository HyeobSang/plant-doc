/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // src 폴더의 모든 jsx, js, tsx, ts 파일에서 클래스를 스캔합니다.
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      // Plant Doctor 앱에서 사용할 폰트 정의
      fontFamily: {
        inter: ['Inter', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}
