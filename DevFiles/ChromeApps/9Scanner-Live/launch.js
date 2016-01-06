chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
      width: 1400,
      height: 800
  });
});
