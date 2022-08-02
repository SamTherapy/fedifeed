window.genUrl = function genUrl() {
  function val(id) {
    return document.getElementById(id).value;
  }

  let user = val("usernamein");
  let instance = "https://" + val("urlin");

  let showBoosts = (!document.getElementById("hideboosts").checked).toString();
  let showReplies = (!document.getElementById("hidereplies")
    .checked).toString();
  let showHeader = document.getElementById("header").checked.toString();
  let portStr =
    window.location.port && window.location.port !== 80
      ? ":" + window.location.port
      : "";

  // Generate the URL for the iframe
  // Prettier, WHY
  let iframeUrl = `${window.location.protocol}//${
    window.location.hostname
  }${portStr}/api/v1/feed?user=${encodeURIComponent(
    user
  )}&instance=${encodeURIComponent(instance)}&instance_type=&theme=${val(
    "theme"
  )}&size=${val(
    "size"
  )}&header=${showHeader}&replies=${showReplies}&boosts=${showBoosts}`;

  // Prettier, WHY
  document.getElementById(
    "result"
  ).value = `<iframe title="Powered by Fedifeed" allowfullscreen sandbox="allow-top-navigation allow-scripts" width="${val(
    "width"
  )}" height="${val("height")}" src="${iframeUrl}"></iframe>`;

  let iframe = document.getElementById("frame");
  iframe.src = iframeUrl;
  iframe.width = val("width");
  iframe.height = val("height");
};
