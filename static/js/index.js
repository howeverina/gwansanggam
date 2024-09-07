function getQueryStringObject() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

var qs = getQueryStringObject()
var edit = qs.e
var version = qs.v

const title = document.getElementById('doc-title').innerText

var wikiJSON = JSON.parse(document.querySelector("#content-hide").innerText)

function parseWiki(text) {
    var text = text.replace(/\\n\\n/gm, '\n\n')
    text = text.replace(/\\n/gm, '\n')
    var markdown = marked.parse(text)
    markdown = markdown.replace(/href\=\"([^\"\:]+)\"\>([^\<]+)\</gm, 'href="./$1">$2<')
    markdown = markdown.replace(/href\=\"\"\>([^\<]+)\</gm, 'href="./$1">$1<')
    markdown = markdown.replace(/\.\/([^\"\:\<\>]+)\/([^\"\:\<\>\/]+)\"/gm, './$1%2F$2"')

    return markdown
}

function handleEditClick() {
    location.href="./"+title+"?e=true"
}

function handleHistoryClick() {
    location.href="./"+title+"?v=list"
}

function simpleParse(text) {
    text = text.replace(/\\n\\n/gm, '\n\n')
    text = text.replace(/\\n/gm, '\n')
    var markdown = marked.parse(text)
    markdown = markdown.replace(/href\=\"([^\"\:]+)\"\>([^\<]+)\</gm, 'href="./?d=$1">$2<')
    markdown = markdown.replace(/href\=\"\"\>([^\<]+)\</gm, 'href="./?d=$1">$1<')
    return markdown
}

function changePostDisabled(e) {
    document.querySelector('#wordcount').innerText = e.value.length
    document.querySelector('#post-preview').innerHTML = simpleParse(e.value)
    if (e.value != '' ) {
        document.querySelector('#post-button').disabled = false
    } else {
        document.querySelector('#post-button').disabled = true
    }
}

if (version == 'list') {
    document.getElementById('content').innerHTML = '<div>변경 기록</div><table id="version-list"><thead><tr><td>버전</td><td>변경 날짜</td><td>작업 수행</td></tr></thead><tbody></tbody></table>';
    for (var i=0; i<wikiJSON.length - 1; i++) {
        document.querySelector('#version-list>tbody').innerHTML += '<tr><td>v'+(wikiJSON.length-1-i)+'</td><td>'+wikiJSON[(wikiJSON.length-1-i)][1]+'</td><td><a href="./'+title+'?v='+(wikiJSON.length-1-i)+'">읽기</a> · <a href="./'+title+'?e=true&v='+(wikiJSON.length-1-i)+'">이 버전으로부터 편집</a></td></tr>';
    }
} else if (version && !edit) {
    document.querySelector("#content").innerHTML = parseWiki(wikiJSON[version][2].replace(/\!\[([^\[\]].+)\]\(\)\<([^\>]+)\>/gm, '$2'))
} else if (!version && !edit) {
    document.querySelector("#content").innerHTML = parseWiki(wikiJSON[wikiJSON.length - 1][2].replace(/\!\[([^\[\]].+)\]\(\)\<([^\>]+)\>/gm, '$2'))
} else if (edit && !version) {
    document.getElementById('content').innerHTML = '<div id="post-label">'+title+' 편집: <span id="wordcount"></span></div><textarea id="post-input" oninput="changePostDisabled(this)">'+wikiJSON[wikiJSON.length - 1][2].replace(/\\n/gm, '&#010;').replace(/\!\[([^\[\]].+)\]\(\)\<([^\>]+)\>/gm, '![$1]()')+`</textarea><button id="post-button" disabled="true" onclick="">편집 완료!</button><div id="post-preview"></div>`;
    
    window.addEventListener('beforeunload', function (e) {
        if (!beforeUnloadAlert) return;
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
    });
}