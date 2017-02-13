const getParameterByName = name => {
    const url = window.location.hash;
    name = name.replace(/[\[\]]/g, "\\$&");

    const regex = new RegExp(name + "(=([^&#]*)|&|#|$)");
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

chrome.storage.sync.set({
    access_token: getParameterByName('access_token')
}, () => window.close());