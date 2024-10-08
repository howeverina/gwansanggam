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
var docs = qs.d

document.querySelector('#doc-title').innerText += ': ' + docs

var googleToken = ''
var googleEmail = ''
var expireDate = new Date()

document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-x" onclick="handleAuthClick()" ></i>'

var wikiList = eval(document.querySelector("#wikiList").innerText)
if (wikiList.includes(docs)) {
    location.href = document.querySelector('#wikiUrl').href + docs
}

if (localStorage.getItem('googleToken')) {
    googleToken = localStorage.getItem('googleToken')
    googleEmail = localStorage.getItem('googleEmail')
    expireDate = Date.parse(localStorage.getItem('tokenExpireDate'))
    document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-voice" onclick="handleSignoutClick()" ></i>'
    if (expireDate < new Date()){
        localStorage.removeItem('googleToken')
        localStorage.removeItem('googleEmail')
        localStorage.removeItem('expireDate')
        googleToken = ''
        googleEmail = ''
        expireDate = new Date()
        document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-x" onclick="handleAuthClick()" ></i>'
        document.querySelector('#content').innerText = '문서 생성 권한이 없습니다. 오른쪽 위의 로그인 버튼을 눌러 로그인해 주세요.'
    } else {
        if (confirm("새 문서를 생성하시겠습니까?") == true) {
            postDocs(docs)
        } else {
            document.getElementById('content').innerText = "문서 생성을 취소하였습니다.";
        }
    }
} else {
    document.querySelector('#content').innerText = '문서 생성 권한이 없습니다. 오른쪽 위의 로그인 버튼을 눌러 로그인해 주세요.'
}

async function postDocs(title) {
    var sheetId = document.querySelector('#sheetId').className
    var postDocsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`
    const body = JSON.stringify({
        "requests":{
            "addSheet":{
                "properties":{
                    "title": title
                }
            }
        }
    })
    var postDocsParam = {
        method: 'POST',
        headers: {
            Authorization: "Bearer " + googleToken,
        },
        body: body
    }

    try {
        var postDocsFetch = await fetch(postDocsUrl, postDocsParam)
        var postDocsRes = await postDocsFetch.json()

        let values = [
          [
            'uid',
            'created_at',
            'body',
            'email'
          ],
          [
            '0',
            new Date(),
            '',
            googleEmail.split('@')[0]
          ]
        ];
        let body = JSON.stringify({
            values: values
        })
        var appendDocsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${title}:append?valueInputOption=RAW`
        var appendDocsParam = {
            method: 'POST',
            headers: {
                Authorization: "Bearer " + googleToken,
            },
            body: body
        }
        var appendDocs = await fetch(appendDocsUrl, appendDocsParam)
        var appendDocsRes = await appendDocs.json()
        console.log(appendDocsRes)

        location.href = document.querySelector('#wikiUrl').href
    } catch (err) {
        console.error(err)
    }
}