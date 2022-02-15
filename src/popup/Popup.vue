<template>
  <!-- 共通 -->
  <div class="root-container">
    <div class="sigunout-button-wrap">
      <button class="gray-button" v-if="isLogin === LoginStatus.IN" @click="signout()">サインアウト</button>
    </div>
    <div class="common">
      <div class="title">- SEARCHISTORY -</div>
      <button class="pink-button">
        <a href="https://searchistory.web.app/" target="_blank" rel="noopener noreferrer">アプリへ</a>
      </button>
    </div>
    <!--■■■■■■■■■■■■■■■■■ 初期 ■■■■■■■■■■■■■■■■■-->
    <div v-if="authCheckPending"></div>
    <!--■■■■■■■■■■■■■■■■■ ログアウト中 ■■■■■■■■■■■■■■■■■-->
    <div class="auth-wrap" v-else-if="isLogin === LoginStatus.OUT && authCheckPending === false">
      <div class="top-alert">
        <p>サインアップがまだの場合は、上記ボタンよりアプリに移動してサインアップを行ってください。</p>
      </div>
      <div class="form">
        <p>メール</p>
        <input type="email" v-model="email" />
      </div>
      <div class="form pass-word">
        <p>パスワード</p>
        <input type="password" v-model="password" />
      </div>
      <div class="login-buttons">
        <button class="pink-button" @click="signin()">ログイン</button>
        <button class="sample-button" @click="signin(true)">サンプルユーザーでログイン</button>
      </div>
    </div>
    <!--■■■■■■■■■■■■■■■■■ ログイン中 ■■■■■■■■■■■■■■■■■-->
    <div class="login" v-else-if="isLogin === LoginStatus.IN">
      <div class="user-info">
        <div class="info-row">
          <div class="info-title in-mail">ログインメール</div>
          <div class="info-data">{{ user?.email }}</div>
        </div>
      </div>
      <!--================= topicエリア =================-->
      <div class="area-box">
        <div class="info-row">
          <div class="info-title in-topic">トピックID</div>
          <div class="info-data">{{ targetTopicID }}</div>
        </div>
        <div class="info-row">
          <div class="info-title in-topic">タイトル</div>
          <div class="info-data">{{ targetTopicTitle }}</div>
        </div>
        <div class="topic-form-box">
          <input class="topic-form" type="text" v-model="formTopicID" />
          <button class="pink-button" @click="registerTopicID()">トピック登録</button>
        </div>
      </div>
      <!--================= historyエリア =================-->
      <div class="area-box" v-if="isPreview">
        <div v-if="!history" class="no-exit">このページの調査履歴はありません。</div>
        <div class="info-row">
          <div class="info-title in-history">タイトル</div>
          <div class="info-data">{{ targetTitle }}</div>
        </div>
        <div class="info-row">
          <div class="info-title in-history">URL</div>
          <div class="info-data">{{ targetURL }}</div>
        </div>
        <!-- 結果あった場合 -->
        <div v-if="history" class="info-row">
          <div class="info-title in-history">状態</div>
          <div class="info-data">
            {{ displayStatus(history.status) }}
            <select
              v-model="selectedStatus"
              v-on:change="statusChange()"
            >
              <option value="pending">未調査</option>
              <option value="unsolved">未解決</option>
              <option value="solved">解決済</option>
            </select>
          </div>
        </div>
        <div v-if="history" class="info-row">
          <div class="info-title in-history">ID</div>
          <div class="info-data">{{ history.docID }}</div>
        </div>
        <!--================= bottom =================-->
        <div class="bottom-button-wrap">
          <button v-if="!history" class="pink-button" @click="createHistory()">このページの履歴を作成する</button>
          <button v-else class="pink-button" @click="copy(history.docID)">この履歴のIDをコピーする</button>
          <button class="gray-button" @click="setPreview(false)">閉じる</button>
        </div>
      </div>
      <!--================= 調査確認ボタン =================-->
      <button
        class="light-pink-button"
        v-if="targetTopicID !== '未設定' && targetTopicID"
        @click="getHistory('page')"
      >現在のページの調査履歴確認</button>
      <button
        class="light-pink-button"
        v-if="targetTopicID !== '未設定' && targetTopicID"
        @click="getHistory('link')"
      >セットしたリンクの調査結果確認</button>
    </div>
  </div>
  <div v-if="infoMessage" class="info-window">{{ infoMessage }}</div>
</template>
<!--■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ SCRIPT ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-->
<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue'
import { db } from "./firebase"
import { getAuth, signOut, signInWithEmailAndPassword, onAuthStateChanged, User, }
  from 'firebase/auth'
import { getDoc, doc, query, collection, where, getDocs, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

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

    //■■■■■■■■■■■■■■■■■■■ サインイン ■■■■■■■■■■■■■■■■■■■■
    const signin = async (isTest: boolean = false) => {
      if (isTest) {
        switch (email.value) {
          case "0":
            email.value = "1s@g.com";
            break;
          case "1":
            email.value = "1s@g.com";
            break;
          case "2":
            email.value = "2s@g.com";
            break;
          case "3":
            email.value = "3s@g.com";
            break;
          default:
            break;
        }
        email.value = "1s@g.com";
        password.value = "11111111";
      }
      return await signInWithEmailAndPassword(auth, email.value, password.value)
        .then(async () => {
          _pushInfoMessage("ログインしました!")
          return true;
        })
        .catch((error) => {
          _firebaseErrorHandle(error)
          return false;
        });
    };
    //■■■■■■■■■■■■■■■■■■■ サインアウト ■■■■■■■■■■■■■■■■■■■■
    const signout = () => {
      signOut(auth).then(() => {
        resetValue();
        _pushInfoMessage("ログアウトしました!")
      });
    };
    //■■■■■■■■■■■■■■■■■■■ ログイン状態監視 ■■■■■■■■■■■■■■■■■■■■
    const _setUser = (u: User | null) => {
      if (u) {
        user.value = u
        isLogin.value = LoginStatus.IN;
      } else {
        isLogin.value = LoginStatus.OUT;
      }
      setTimeout(() => { authCheckPending.value = false; }, 1000);
    };

    onAuthStateChanged(auth, (u) => {
      _setUser(u);
    })
    //■■■■■■■■■■■■■■■■■■■ マウンテッド時 ■■■■■■■■■■■■■■■■■■■■
    onBeforeMount(() => {
      authCheckPending.value = true;
      targetTopicID.value = localStorage["targetTopicID"] ? localStorage["targetTopicID"] : "未設定";
      targetTopicTitle.value = localStorage["targetTopicTitle"] ? localStorage["targetTopicTitle"] : "未設定";
      _setUser(auth.currentUser);
    }
    )
    //■■■■■■■■■■■■■■■■■■■ topic制御 ■■■■■■■■■■■■■■■■■■■■
    const formTopicID = ref("");
    const targetTopicID = ref("");
    const targetTopicTitle = ref("");

    const _setTargetTopic = (id: string, title: string) => {
      localStorage["targetTopicID"] = id;
      localStorage["targetTopicTitle"] = title;
      targetTopicID.value = localStorage["targetTopicID"];
      targetTopicTitle.value = localStorage["targetTopicTitle"];
    };
    //=================== topic登録 ====================
    const registerTopicID = async () => {
      if (formTopicID.value.length !== 20) {
        alert("トピックIDの形式が正しくありません。");
        return;
      }
      const docRef = doc(db, "topic", formTopicID.value);
      try {
        const topicDocSnap = await getDoc(docRef)
        if (!topicDocSnap.exists()) {
          alert("そのIDのトピックは存在しません。");
          _setTargetTopic("未設定", "未設定")
        } else {
          const topicDocData = topicDocSnap.data();
          _setTargetTopic(formTopicID.value, topicDocData.title);
          formTopicID.value = "";
          _pushInfoMessage("トピックを設定しました!")
        }
      } catch (error: any) {
        _firebaseErrorHandle(error);
      }
    };
    //■■■■■■■■■■■■■■■■■■■ history制御 ■■■■■■■■■■■■■■■■■■■■
    const targetURL = ref("");
    const targetTitle = ref("");
    const history = ref<any | null>(null);

    const displayStatus = (status: string) => {
      switch (status) {
        case "pending":
          return "未調査"
        case "unsolved":
          return "未解決"
        case "solved":
          return "解決"
        default:
          break;
      }
    }
    //=================== 取得 ====================
    const _getHistoryFromFB = async () => {
      const q = query(collection(db, "topic", targetTopicID.value, "history"), where("url", "==", targetURL.value));
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.docs.length === 0) {
          history.value = null
        } else {
          history.value = querySnapshot.docs[0].data();
          selectedStatus.value = history.value.status;
        }
        setPreview(true);
      } catch (error: any) {
        _firebaseErrorHandle(error);
      }
    };

    const getHistory = async (type: string) => {
      switch (type) {
        case 'link':
          chrome.storage.sync.get(["targetURL", "targetTitle"], async (items) => {
            targetURL.value = items.targetURL;
            targetTitle.value = items.targetTitle;
          })
          _getHistoryFromFB();
          break;
        case 'page':
          chrome.tabs.query({
            active: true,
            currentWindow: true,
          }, (tabs) => {
            const tab = tabs[0];
            targetURL.value = tab.url ?? "";
            targetTitle.value = tab.title ?? "";
            _getHistoryFromFB();
          });
          break;
        case 'afterCreate':
          _getHistoryFromFB();
          break;
      }
    };
    //=================== 作成 ====================
    const createHistory = async () => {
      console.log("⬇︎【ログ】", "targetTopicID.value"); console.log(targetTopicID.value);
      const auth = getAuth();
      const users = auth.currentUser;
      console.log("⬇︎【ログ】", "users?.uid"); console.log(users?.uid);
      console.log("⬇︎【ログ】", "uid"); console.log(user.value?.uid);

      const newHistoryRef = doc(collection(db, 'topic', targetTopicID.value, 'history'));
      try {
        await setDoc(newHistoryRef, {
          url: targetURL.value,
          title: targetTitle.value,
          content: "",
          status: "pending",
          files: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          docID: newHistoryRef.id,
          topicDocID: targetTopicID.value,
          uid: user.value?.uid,
        });
        _pushInfoMessage("このURLのページの調査履歴を作成しました。")
        getHistory("afterCreate");
      } catch (error: any) {
        _firebaseErrorHandle(error);
      }
    };
    //=================== 状態変更 ====================
    const selectedStatus = ref("");

    const statusChange = async () => {
      const updateHistoryRef = doc(db, 'topic', targetTopicID.value, 'history', history.value.docID);
      try {
        await updateDoc(updateHistoryRef, {
          status: selectedStatus.value,
          updatedAt: serverTimestamp(),
        });
        getHistory("afterCreate");
        _pushInfoMessage("調査状態を変更しました。")
      } catch (error: any) {
        _firebaseErrorHandle(error);
      }
    };
    //■■■■■■■■■■■■■■■■■■■ 結果表示制御 ■■■■■■■■■■■■■■■■■■■■
    const isPreview = ref(false);
    const setPreview = (flag: boolean) => {
      isPreview.value = flag;
    }
    //■■■■■■■■■■■■■■■■■■■ 初期化 ■■■■■■■■■■■■■■■■■■■■
    const resetValue = () => {
      authCheckPending.value = true;
      email.value = "";
      password.value = "";
      isLogin.value = "out";
      user.value = null;
      formTopicID.value = "";
      targetTopicID.value = "";
      targetTopicTitle.value = "";
      targetURL.value = "";
      targetTitle.value = "";
      history.value = null;
      selectedStatus.value = "";
      isPreview.value = false;
      localStorage["targetTopicID"] = "";
      localStorage["targetTopicTitle"] = "";
      chrome.storage.sync.set(
        {
          targetURL: ""
        })
      infoMessage.value = null;
    };
    //■■■■■■■■■■■■■■■■■■■ コピー ■■■■■■■■■■■■■■■■■■■■
    const copy = (docID: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(docID);
        _pushInfoMessage("IDをコピーしました!")
      }
    };
    //■■■■■■■■■■■■■■■■■■■ 情報メッセージ制御 ■■■■■■■■■■■■■■■■■■■■
    const infoMessage = ref<string | null>(null);

    const _pushInfoMessage = (message: string) => {
      infoMessage.value = message;
      setTimeout(() => {
        infoMessage.value = null;
      }, 2000
      )
    };
    //■■■■■■■■■■■■■■■■■■■ エラーハンドル ■■■■■■■■■■■■■■■■■■■■
    const _firebaseErrorHandle = (error: string) => {
      const permissionReg = /insufficient permissions./;
      const invalidEmailReg = /invalid-email/;
      const userNotFoundReg = /user-not-found/;
      const wrongPasswordReg = /wrong-password/;

      if (permissionReg.test(error)) {
        alert("アクセスする権限がありません。");
      } else if (invalidEmailReg.test(error)) {
        alert("メールアドレスが正しくありません。");
      } else if (userNotFoundReg.test(error)) {
        alert("そのメールアドレスは正しくありません。");
      } else if (wrongPasswordReg.test(error)) {
        alert("パスワードが正しくありません。");
      } else {
        alert(`エラーが発生しました。${error}`);
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
      createHistory,
      isPreview,
      LoginStatus,
      targetURL,
      targetTitle,
      setPreview,
      history,
      copy,
      displayStatus,
      selectedStatus,
      statusChange,
      infoMessage
    }
  },
})
</script>

<style scoped>
/* ===============  basic =================*/
a {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: white;
}
button {
  border-radius: 5px;
  height: 25px;
}
button:hover {
  cursor: pointer;
}
/* ===============  base =================*/
.root-container {
  width: 300px;
  align-items: center;
  flex-direction: column;
}
.common {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 10px;
}
.auth-wrap {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.user-info {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 3px;
}
.area-box {
  background-color: whitesmoke;
  border-radius: 5px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-direction: column;
  border: solid 1px gray;
  padding: 5px;
}
/* ===============  middle-base =================*/
.login-buttons {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sigunout-button-wrap {
  display: flex;
  justify-content: end;
}
.topic-form-box {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
}
.topic-form {
  text-align: center;
  width: 180px;
  height: 20px;
  border-radius: 5px;
  border: solid 1px gray;
  margin-right: 5px;
}
.bottom-button-wrap {
  width: 100%;
  margin-top: 10px;
  display: flex;
  justify-content: space-evenly;
}

/* ===============  module =================*/
.top-alert {
  border: solid 1px gray;
  padding: 3px;
  border-radius: 5px;
}
/* --------- 情報1行 ---------*/
.info-row {
  display: flex;
  margin-top: 3px;
  width: 100%;
  border: solid 1px gray;
  border-radius: 2px;
  background-color: white;
}
.no-exit {
  margin-top: 3px;
  width: 100%;
  border: solid 1px gray;
  border-radius: 2px;
  background-color: white;
  color: red;
  text-align: center;
}
.info-title {
  border: solid 1px gray;
  background-color: lightgray;
  text-align: center;
  margin: 2px;
  line-height: 18px;
}
.in-mail {
  min-width: 90px;
}
.in-topic {
  min-width: 70px;
}
.in-history {
  min-width: 60px;
}
.info-data {
  padding: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-data > select {
  margin-left: 5px;
}
.info-window {
  margin-top: 15px;
  color: white;
  background-color: red;
  border: solid 1px black;
  border-radius: 3px;
  text-align: center;
}
/* --------- ボタン ---------*/
/* グレイボタン */
.gray-button {
  background-color: lightslategrey;
  border: solid 1px lightslategray;
  color: white;
}
/* ピンクボタン */
.pink-button {
  background-color: hotpink;
  color: white;
  border: solid 1px gray;
}
/* ライトピンクボタン */
.light-pink-button {
  margin-top: 10px;
  width: 100%;
  background-color: lightpink;
  border: solid 1px gray;
}
.sample-button {
  width: 200px;
  margin-top: 10px;
  background-color: gray;
  color: lightgray;
  border: solid 1px gray;
}
/* --------- タイトル ---------*/
.title {
  border: solid 1px gray;
  background-color: white;
  border-radius: 20px;
  padding: 3px 20px 3px 20px;
  font-size: 15px;
  text-align: center;
  margin-bottom: 10px;
}
/* --------- authフォーム ---------*/
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
  height: 20px;
  border-radius: 5px;
  border: solid 1px gray;
}
</style>
