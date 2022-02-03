import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCpHjiCM2uCBBv3fbgjFypF9BkClBIKaBE",
  authDomain: "searchistory.firebaseapp.com",
  projectId: "searchistory",
  storageBucket: "searchistory.appspot.com",
  messagingSenderId: "856415482516",
  appId: "1:856415482516:web:d98aa2f20615d738043a81",
  measurementId: "G-PVKMNSKQC8",
};
initializeApp(firebaseConfig)
const auth = getAuth()

// ChromeアプリからGoogleログインしてトークン取得
chrome.identity.getAuthToken(
  { interactive: true },
  (token: string) => {
    console.log('token', token)
    // Googleログイン成功時に受け取るトークンを使ってGoogleのクレデンシャル作成
    const credential = GoogleAuthProvider.credential(null, token)
    console.log('credential:', credential)
    console.log('auth:', auth)

    // Googleユーザーのクレデンシャルを使ってサインイン
    signInWithCredential(auth, credential).then((result) => {
      console.log("Sign In Success", result)
    }).catch((error) => {
      console.log("Sign In Error", error)
    })
  }
)
