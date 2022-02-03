chrome.runtime.onInstalled.addListener(() => {
  console.log("event")
  chrome.contextMenus.create({
    id: 'Chapter 6',
    title: 'Search Twitter for \'%s\'',
    type: 'normal',
    contexts: ['selection']
  });
});
chrome.contextMenus.onClicked.addListener((info) => {
  chrome.tabs.create({
    url: 'http://twitter.com/search?q=' + encodeURIComponent(info.selectionText)
  });
});
