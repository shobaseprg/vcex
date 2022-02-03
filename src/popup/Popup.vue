<template>
  <!-- ログイン -->
  <div v-if="!isLogin">
    <div v-if="!isLogin">
      <p>メール</p>
      <input v-model="email" />
    </div>
    <div>
      <p>パスワード</p>
      <input v-model="password" />
    </div>
    <button @click="signin()">ログイン</button>
    <button @click="signin(true)">テストログイン</button>
  </div>
  <!-- ログイン中 -->
  <div v-else>
    <p>ログイン中</p>
    <p>{{ user?.email }}</p>
    <p>topic:{{ targetTopicUID }}</p>
    <input type="text" v-model="topicUID" />
    <button @click="registerTopicUID()">トピック登録</button>
    <button @click="signout()">サインアウト</button>
    <button @click="getTest">テスト</button>
    <button @click="getURL">ゲット</button>
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
    const isLogin = ref(false);
    const user = ref<User | null>(null);
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
        alert("ログアウトしました。")
      });
    };
    // ログイン状態
    onAuthStateChanged(auth, (user) => {
      if (user) {
        isLogin.value = true;
      } else {
        isLogin.value = false;
      }
    })
    // topicUID制御
    const topicUID = ref("");
    const targetTopicUID = ref("");

    onBeforeMount(() => {
      targetTopicUID.value = localStorage["targetTopicUID"] ? localStorage["targetTopicUID"] : "";
    }
    )

    const registerTopicUID = () => {
      localStorage["targetTopicUID"] = topicUID.value;
      topicUID.value = "";
      targetTopicUID.value = localStorage["targetTopicUID"];
    };

    const getTest = async () => {
      console.log(targetTopicUID.value);
      const docRef = doc(db, "topic", targetTopicUID.value)
      const d = await getDoc(docRef)
      console.log(d.data());
    };


    const getURL = async () => {
      chrome.storage.sync.get(["targetURL"], async (items) => {
        console.log("⬇︎【ログ】", "targetTopicUID.value"); console.log(targetTopicUID.value);
        // LfgZ7LCJmGX7nElsIgAN
        const uid = targetTopicUID.value
        console.log("⬇︎【ログ】", "uid"); console.log(typeof uid);
        const colRef = collection(db, "topic", uid, "history")
        const q = query(colRef, where("url", "==", items.targetURL))
        const querySnapshot = await getDocs(q);
        console.log("⬇︎【ログ】", "querySnapshot"); console.log(querySnapshot);
        console.log("⬇︎【ログ】", "items.targetURL"); console.log(items.targetURL);
        if (querySnapshot.docs.length === 0) {
          alert("調査履歴はありません。")
        } else {
          console.log("あり");
          console.log(querySnapshot.docs[0].data())
        }

      });
    };



    return { email, password, signin, isLogin, signout, topicUID, user, registerTopicUID, targetTopicUID, getTest, getURL }
  },
})
</script>
