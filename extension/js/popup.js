$('button').on('click', function() {
  chrome.tabs.create({'url': 'main.html'});
})