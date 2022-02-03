
chrome.runtime.onInstalled.addListener(() => {
  console.log("event")
  chrome.contextMenus.create({
    id: 'Chapter 6',
    title: 'Search Twitter for \'%s\'',
    type: 'normal',
    contexts: ['selection']
  });
});
chrome.contextMenus.onClicked.addListener(async (info) => {
  console.log(info);
  // chrome.storage.syncを使ったデータの保存（指定したkeyに対して、任意のvalueを保存）
  chrome.storage.sync.set(
    {
      targetURL: info.linkUrl
    }
  )
});
