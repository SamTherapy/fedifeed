window.genUrl = function genUrl() {
    function val(id) {
        return document.getElementById(id).value;
    }

    let user = val("usernamein");
    let instance = "https://" + val("urlin");

    var showBoosts = (!document.getElementById("hideboosts").checked).toString();
    var showReplies = (!document.getElementById("hidereplies").checked).toString();
    var showHeader = document.getElementById("header").checked.toString();
    var portStr = (window.location.port && window.location.port != 80) ? (":" + window.location.port) : "";

    var iframeUrl = window.location.protocol + "//" + window.location.hostname + portStr
        + "/api/v1/feed?user=" + encodeURIComponent(user) + "&instance=" + encodeURIComponent(instance) + "&instance_type=" + "&theme=" + val("theme") + "&size=" + val("size")
        + "&header=" + showHeader + "&replies=" + showReplies + "&boosts=" + showBoosts;

    document.getElementById("result").value = "<iframe allowfullscreen sandbox=\"allow-top-navigation allow-scripts\" width=\"" + val("width") + "\" height=\"" + val("height") + "\" src=\"" + iframeUrl + "\"></iframe>";

    var iframe = document.getElementById("frame");
    iframe.src = iframeUrl;
    iframe.width = val("width");
    iframe.height = val("height");
};