<template>
  <!-- 共通 -->
  <div class="root-container">
    <div class="sigunout-button-wrap">
      <button class="close-button" v-if="isLogin === LoginStatus.IN" @click="signout()">サインアウト</button>
    </div>
    <div class="common">
      <div class="title">
        <p>- SEARCHISTORY -</p>
      </div>
      <button class="auth-button">
        <a href="https://searchistory.web.app/" target="_blank" rel="noopener noreferrer">アプリへ</a>
      </button>
    </div>
    <!-- 初期 -->
    <div v-if="authCheckPending"></div>
    <!-- ログアウト  -->
    <div class="logout" v-else-if="isLogin === LoginStatus.OUT && authCheckPending === false">
      <p>サインアップがまだの場合は、上記ボタンよりアプリに移動してサインアップを行ってください。</p>
      <!-- メール -->
      <div class="form">
        <p>メール</p>
        <input type="email" v-model="email" />
      </div>
      <!-- パスワード -->
      <div class="form pass-word">
        <p>パスワード</p>
        <input type="password" v-model="password" />
      </div>
      <button class="auth-button" @click="signin()">ログイン</button>
      <button class="auth-button sample-button" @click="signin(true)">サンプルユーザーでログイン</button>
    </div>
    <!-- ログイン中 -->
    <div class="login" v-else-if="isLogin === LoginStatus.IN">
      <div class="data-row">
        <div class="data-title">ログインメール</div>
        <div class="data-data">{{ user?.email }}</div>
      </div>
      <!-- トピックID -->
      <div class="data-row">
        <div class="data-title">topicID</div>
        <div class="data-data">{{ targetTopicID }}</div>
      </div>
      <!-- タイトル -->
      <div class="data-row">
        <div class="data-title">タイトル</div>
        <div class="data-data">{{ targetTopicTitle }}</div>
      </div>
      <!-- トピックIDフォーム -->
      <input class="topic-form" type="text" v-model="formTopicID" />
      <button class="auth-button" @click="registerTopicID()">トピック登録</button>
      <!-- 結果確認 -->
      <div class="result-prev" v-if="isPreview">
        <div class="data-row">
          <div class="url-display">URL</div>
          <div class="data-data">{{ targetURL }}</div>
        </div>
        <div v-if="!history">このページの調査履歴はありません。</div>
        <div v-else>
          <div>調査状態:{{ history.status }}</div>
          <button @click="copy(history.docID)">この履歴のIDをコピーする</button>
        </div>
        <div class="close-button-wrap">
          <button class="close-button" @click="setPreview(false)">閉じる</button>
        </div>
      </div>
      <button
        class="result-button"
        v-if="targetTopicID !== '未設定' && targetTopicID"
        @click="getHistory"
      >調査結果確認</button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'
import { db } from "./firebase"
import { getAuth, signOut, signInWithEmailAndPassword, onAuthStateChanged, User, }
  from 'firebase/auth'
import { getDoc, doc, query, collection, where, getDocs } from "firebase/firestore";

const auth = getAuth();

export default defineComponent({
  name: 'Popup',
  setup() {
    const LoginStatus = {
      IN: 'in',
      OUT: 'out',
    } as const;

    type LoginStatus = typeof LoginStatus[keyof typeof LoginStatus];

    const authCheckPending = ref(true);
    const email = ref("");
    const password = ref("");
    const isLogin = ref<LoginStatus>(LoginStatus.OUT);
    const user = ref<User | null>(null);

    // サインイン
    const signin = async (isTest: boolean = false) => {
      if (isTest) {
        email.value = "1@g.com";
        password.value = "11111111";
      }
      return await signInWithEmailAndPassword(auth, email.value, password.value)
        .then(async () => {
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

    const _setUser = (u: User | null) => {
      if (u) {
        user.value = u
        isLogin.value = LoginStatus.IN;
      } else {
        isLogin.value = LoginStatus.OUT;
      }
      setTimeout(() => { authCheckPending.value = false; }, 1000);
    };

    // ログイン状態
    onAuthStateChanged(auth, (u) => {
      _setUser(u);
    })

    // マウンテッド時
    onBeforeMount(() => {
      authCheckPending.value = true;
      targetTopicID.value = localStorage["targetTopicID"] ? localStorage["targetTopicID"] : "未設定";
      targetTopicTitle.value = localStorage["targetTopicTitle"] ? localStorage["targetTopicTitle"] : "未設定";
      _setUser(auth.currentUser);
    }
    )

    // topicID制御
    const formTopicID = ref("");
    const targetTopicID = ref("");
    const targetTopicTitle = ref("");

    const _setTargetTopic = (id: string, title: string) => {
      localStorage["targetTopicID"] = id;
      localStorage["targetTopicTitle"] = title;
      targetTopicID.value = localStorage["targetTopicID"];
      targetTopicTitle.value = localStorage["targetTopicTitle"];
    };

    // マウンテッド時
    onBeforeMount(() => {
      targetTopicID.value = localStorage["targetTopicID"] ? localStorage["targetTopicID"] : "未設定";
      targetTopicTitle.value = localStorage["targetTopicTitle"] ? localStorage["targetTopicTitle"] : "未設定";
      onAuthStateChanged(auth, (user) => {
        if (user && user.email) {
          email.value = user.email
          isLogin.value = LoginStatus.IN;
        } else {
          isLogin.value = LoginStatus.OUT;
        }
      })
    }
    )

    const registerTopicID = async () => {
      const docRef = doc(db, "topic", formTopicID.value)
      try {
        const topicDocSnap = await getDoc(docRef)
        if (!topicDocSnap.exists()) {
          alert("そのIDの事案は存在しません。");
          _setTargetTopic("未設定", "未設定")
        } else {
          const topicDocData = topicDocSnap.data();
          _setTargetTopic(formTopicID.value, topicDocData.title)
        }
      } catch (error: any) {
        console.log(error);
        _firebaseErrorHandle(error);
      }
      // todo自分に権限がない時の処理
    };
    // URL制御
    const targetURL = ref("");
    const history = ref<any | null>(null);

    const getHistory = async () => {
      chrome.storage.sync.get(["targetURL"], async (items) => {
        targetURL.value = items.targetURL;
        console.log("⬇︎【ログ】", "targetTopicID.value"); console.log(targetTopicID.value);
        const id = targetTopicID.value
        console.log("⬇︎【ログ】", "id"); console.log(typeof id);
        const colRef = collection(db, "topic", id, "history")
        const querySnapshot = await getDocs(colRef);
        console.log("⬇︎【ログ】", "querySnapshot"); console.log(querySnapshot);
        console.log("⬇︎【ログ】", "items.targetURL"); console.log(items.targetURL);
        if (querySnapshot.docs.length === 0) {
          history.value = null
        } else {
          for (let i = 0; i < querySnapshot.docs.length; i++) {
            const historyData = querySnapshot.docs[0].data()
            if (historyData.url === items.targetURL) {
              history.value = historyData;
              break;
            }
          }
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
      isLogin.value = "out";
      user.value = null;
      formTopicID.value = "";
      targetTopicID.value = "";
      targetTopicTitle.value = "";
      targetURL.value = "";
      isPreview.value = false;
      localStorage["targetTopicID"] = "";
      localStorage["targetTopicTitle"] = "";
      chrome.storage.sync.set(
        {
          targetURL: ""
        })
    };

    const copy = (docID: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(docID);
      }
    };

    const _firebaseErrorHandle = (error: string) => {
      const permissionReg = /insufficient permissions./
      if (permissionReg.test(error)) {
        alert("このIDの事案にアクセスする権限がありません。");
      } else {
        alert("エラーが発生しました。");
      }
    }

    return {
      authCheckPending,
      email,
      password,
      signin,
      isLogin,
      signout,
      formTopicID,
      user,
      registerTopicID,
      targetTopicID,
      targetTopicTitle,
      getHistory,
      isPreview,
      LoginStatus,
      targetURL,
      setPreview,
      history,
      copy
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
  color: white;
}

button {
  border-radius: 5px;
}

button:hover {
  cursor: pointer;
}

.root-container {
  width: 300px;
}

.common {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.title {
  font-size: 15px;
  text-align: center;
  margin: 10xp;
}

.logout {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.login {
  padding-top: 10px;
}
.form {
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.form > p {
  text-align: center;
  font-size: 13px;
  margin-bottom: 5px;
}

.form > input {
  width: 80%;
  border-radius: 5px;
  border: solid 1px gray;
}
.pass-word {
  margin-bottom: 15px;
}

.topic-form {
  width: 190px;
  margin-right: 8px;
}

.auth-button {
  margin-top: 10px;
  background-color: hotpink;
  color: white;
  border: solid 1px hotpink;
}

.button-box {
  margin-top: 30px;
}

.sample-button {
  width: 200px;
  margin-top: 10px;
  background-color: gray;
  color: lightgray;
  border: solid 1px gray;
}

.sigunout-button-wrap {
  display: flex;
  justify-content: end;
}
.result-button {
  margin-top: 10px;
  width: 100%;
  background-color: lightpink;
  border: solid 1px black;
}
.result-prev {
  margin-top: 10px;
  background: white;
  border-radius: 5px;
  border: solid 1px gray;

  padding: 5px;
}
.close-button-wrap {
  display: flex;
  justify-content: end;
}
.close-button {
  background-color: lightslategrey;
  border: solid 1px lightslategray;
  color: white;
}

.data-row {
  display: flex;
  padding: 2px;
  margin: 3px;
  border: solid 1px gray;
  border-radius: 2px;
  background-color: white;
}
.data-title {
  border: solid 1px gray;
  background-color: lightgray;
  min-width: 90px;
  text-align: center;
  line-height: 23px;
}
.data-data {
  padding: 3px;
  white-space: nowrap; /* 横幅のMAXに達しても改行しない */
  overflow: hidden; /* ハミ出した部分を隠す */
  text-overflow: ellipsis; /* 「…」と省略 */
}
.url-row {
  border: solid 1px black;
  border-radius: 3px;
}
.url-display {
  border: solid 1px gray;
  background-color: lightgray;
  width: 30px;
  text-align: center;
  line-height: 23px;
}
</style>
