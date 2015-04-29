var launch = function() {
  chrome.app.window.create('window.html', {
    'bounds': {
      'width': 1280,
      'height': 720
    }
  });
};
chrome.app.runtime.onLaunched.addListener(launch);
chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
    if (request == 'ping') {
        sendResponse('pong');
    } else if (request == 'launch') {
        launch();
    }
});