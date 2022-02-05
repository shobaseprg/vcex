
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "parent",
    title: "Searchistory",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    parentId: "parent",
    id: "setURL",
    title: "このリンクのURLを履歴確認対象にセット",
    contexts: ["selection"],
  });
});


chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "setURL":
      chrome.storage.sync.set(
        {
          targetURL: info.linkUrl
        }
      )
      break;
  }
});
