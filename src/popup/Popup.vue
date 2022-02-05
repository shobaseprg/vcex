<template>
  <!-- 共通 -->
  <div class="root-container">
    <p>Searchistory</p>
    <button>
      <a href="https://searchistory.web.app/" target="_blank" rel="noopener noreferrer">アプリへ</a>
    </button>
    <!-- 初期 -->
    <div v-if="isLogin === LoginStatus.INIT"></div>
    <!-- ログアウト  -->
    <div v-else-if="isLogin === LoginStatus.OUT">
      <p>サインアップがまだの場合は、上記ボタンよりアプリに移動してサインアップを行ってください。</p>
      <p>メール</p>
      <input type="email" v-model="email" />
      <div>
        <p>パスワード</p>
        <input type="password" v-model="password" />
      </div>
      <button class="auth-button" @click="signin()">ログイン</button>
      <button @click="signin(true)">tl</button>
    </div>
    <!-- ログイン中 -->
    <div v-else-if="isLogin === LoginStatus.IN">
      <p>ログイン：{{ user?.email }}</p>
      <!-- トピック情報 -->
      <p>topicUID:{{ targetTopicUID }}</p>
      <p>タイトル:{{ targetTopicTitle }}</p>
      <input type="text" v-model="formTopicUID" />
      <button @click="registerTopicUID()">トピック登録</button>
      <!-- 結果確認 -->
      <div class="result-prev" v-if="isPreview">
        結果表示欄
        <p>url:{{ targetURL }}</p>
        <div v-if="!isResult">このページの調査履歴はありません。</div>
        <div v-else>このページの調査結果はあります。</div>
        <button @click="setPreview(false)">閉じる</button>
      </div>
      <!-- <button @click="getTest">gt</button> -->
      <button @click="getURL">調査結果確認</button>
      <!-- サインアウト -->
      <button @click="signout()">サインアウト</button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'
import { db } from "./firebase"
import { getAuth, signOut, signInWithEmailAndPassword, onAuthStateChanged, User }
  from 'firebase/auth'
import { getDoc, doc, query, collection, where, getDocs } from "firebase/firestore";

const auth = getAuth();

export default defineComponent({
  name: 'Popup',
  setup() {
    const email = ref("");
    const password = ref("");
    const isLogin = ref("init");
    const user = ref<User | null>(null);

    const LoginStatus = {
      INIT: 'init',
      IN: 'in',
      OUT: 'out',
    } as const;

    type LoginStatus = typeof LoginStatus[keyof typeof LoginStatus];

    // サインイン
    const signin = async (isTest: boolean = false) => {
      if (isTest) {
        email.value = "1@g.com";
        password.value = "11111111";
      }
      return await signInWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
          user.value = userCredential.user;
          alert("ログインしました。")
          return true;
        })
        .catch((error) => {
          alert(error.message);
          return false;
        });
    };
    // サインアウト
    const signout = () => {
      signOut(auth).then(() => {
        resetValue();
        alert("ログアウトしました。")
      });
    };
    // ログイン状態
    onAuthStateChanged(auth, (user) => {
      if (user) {
        isLogin.value = LoginStatus.IN;
      } else {
        isLogin.value = LoginStatus.OUT;
      }
    })
    // topicUID制御
    const formTopicUID = ref("");
    const targetTopicUID = ref("");
    const targetTopicTitle = ref("");

    const _setTargetTopic = (uid: string) => {
      localStorage["targetTopicUID"] = uid;
      formTopicUID.value = "";
      targetTopicUID.value = localStorage["targetTopicUID"];
    };

    onBeforeMount(() => {
      targetTopicUID.value = localStorage["targetTopicUID"] ? localStorage["targetTopicUID"] : "未設定";
    }
    )

    const registerTopicUID = async () => {
      _setTargetTopic(formTopicUID.value)

      const docRef = doc(db, "topic", targetTopicUID.value)
      const topicDocSnap = await getDoc(docRef)
      if (!topicDocSnap.exists()) {
        alert("そのIDの事案は存在しません。");
        _setTargetTopic("未設定")
      }
      const topicDocData = topicDocSnap.data();
      if (topicDocData) {
        targetTopicTitle.value = topicDocData.title;
      } else {
        alert("そのIDの事案は存在しません。");
        _setTargetTopic("未設定")
      }
    };
    // URL制御
    const targetURL = ref("");
    const isResult = ref(false);

    const getURL = async () => {
      chrome.storage.sync.get(["targetURL"], async (items) => {
        targetURL.value = items.targetURL;
        console.log("⬇︎【ログ】", "targetTopicUID.value"); console.log(targetTopicUID.value);
        const uid = targetTopicUID.value
        console.log("⬇︎【ログ】", "uid"); console.log(typeof uid);
        const colRef = collection(db, "topic", uid, "history")
        const q = query(colRef, where("url", "==", items.targetURL))
        const querySnapshot = await getDocs(q);
        console.log("⬇︎【ログ】", "querySnapshot"); console.log(querySnapshot);
        console.log("⬇︎【ログ】", "items.targetURL"); console.log(items.targetURL);
        if (querySnapshot.docs.length === 0) {
          isResult.value = false
        } else {
          console.log("あり");
          console.log(querySnapshot.docs[0].data())
        }
        setPreview(true);
      });
    };

    // 結果表示制御
    const isPreview = ref(false);
    const setPreview = (flag: boolean) => {
      isPreview.value = flag;
    }

    // 状態初期化
    const resetValue = () => {
      email.value = "";
      password.value = "";
      isLogin.value = "init";
      user.value = null;
      formTopicUID.value = "";
      targetTopicUID.value = "";
      targetTopicTitle.value = "";
      targetURL.value = "";
      isResult.value = false;
      isPreview.value = false;
      localStorage["targetTopicUID"] = "";
      chrome.storage.sync.set(
        {
          targetURL: ""
        })
    };


    return {
      email,
      password,
      signin,
      isLogin,
      signout,
      formTopicUID,
      user,
      registerTopicUID,
      targetTopicUID,
      targetTopicTitle,
      getURL,
      isPreview,
      LoginStatus,
      targetURL,
      setPreview,
      isResult
    }
  },
})
</script>

<style scoped>
a {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: black;
}

.root-container {
  width: 300px;
  border: solid 1px red;
}

.auth-button {
  margin-top: 30px;
}
.result-prev {
  border: solid 1px green;
}
</style>
