chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
      width: 370,
      height: 430
  });
});
