<template>
    <div id="app">
        <div id="wrapper">
            <div id="navbar">
                <a id="wikiUrl" :href="wikiUrl"><div id="logo">{{ wikiTitle }}</div></a>
                <div id="member-info">
                    <div id="search"><input id="search-input"> <a id="search-button"><i class='bx bx-search'></i></a></div>
                    <div id="status"><span id="isLogin"><i class="bx bx-user-x" onclick="handleAuthClick()" ></i></span></div>
                </div>
            </div>
            <div id="sub-wrapper">
                <div id="title-box">
                    <h1 id="doc-title">{{ rawTitle }}</h1>
                </div>
                <div id="content-box">
                    <div id="content"></div>
                    <div id="sheetId" :class="sheetId"></div>
                    <div id="content-hide" style="display: none;">{{ wikiBody }}</div>
                    <div id="wikiList" style="display: none;">{{ wikiList }}</div>
                </div>
                <div id="footer">
                    <!--Add buttons to initiate auth sequence and sign out-->
                    <button id="edit_button" onclick="handleEditClick()" style="display: none;">편집</button> <button id="history_button" onclick="handleHistoryClick()">역사</button>
                    <div id="cid" :class="clientId"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

const jwt = require('jsonwebtoken');
const querystring = require("querystring");

export default {
    head () {
        return {
            script: [
            { src: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', defer: true },
            { src: 'js/index.js?v=16', defer: true },
            ],
            link: [
            { href: 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css', rel: 'stylesheet'},
            { href: 'css/main.css', rel: 'stylesheet'}
            ]
        }
    },
    async asyncData ({$config: { privateKey }, $config: { wikiTitle }, $config: { frontPage }, $config: { privateKeyId }, $config: { clientEmail }, $config: { sheetId }, $config: { clientId }, $config: { wikiUrl }}) {

        var rawTitle = frontPage
        var secretKey = privateKey.replace(/\\n/gm, '\n')
        wikiUrl = 'https://'+wikiUrl

        const token = jwt.sign(
            { "iss": clientEmail, "scope": "https://www.googleapis.com/auth/spreadsheets", "aud": "https://oauth2.googleapis.com/token" },
            secretKey,
            { algorithm: 'RS256', expiresIn: "1h", keyid: privateKeyId }
        );

        const googleAuthUrl = 'https://oauth2.googleapis.com/token'
        const googleAuthParam = {
                method: 'POST',
                headers: {
                    'content-type': "application/x-www-form-urlencoded",
                },
                body: querystring.stringify({
                    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    assertion: token
                })
            }

        var authData = await fetch(googleAuthUrl, googleAuthParam)
        var authRes = await authData.json()

        const googleSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rawTitle}!A:D`
        const googleSheetParam = {
            method: 'GET',
            headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + authRes.access_token,
            },
        }

        try {
            var sheetData = await fetch(googleSheetUrl, googleSheetParam)
            var sheetRes = await sheetData.json()
            var wikiBody = sheetRes.values

            for (let j=0; j<wikiBody.length; j++) {

                if (wikiBody[j][2]) {
                    if (wikiBody[j][2].includes('![') && wikiBody[j][2].includes(']()\\n')) {
                        let includeArray = wikiBody[j][2].split('![').slice(1)
                        for await (let including of includeArray) {
                            var including2 = including.split(']()\\n')[0]
                            try {
                                const googleSheetUrl2 = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${including2}!A:D`
                                var sheetData2 = await fetch(googleSheetUrl2, googleSheetParam)
                                var sheetRes2 = await sheetData2.json()
                                var content = sheetRes2.values[sheetRes2.values.length - 1][2]
                                wikiBody[j][2] = wikiBody[j][2].replace('!['+including2+']()\\n', '!['+including2+']()<'+content+'>\\n')
                            } catch (err) {
                                //console.log(err)
                            }
                        }
                    }
                }
            }
        } catch {
            wikiBody = [['', '', `${rawTitle} 문서가 없습니다. [생성](${wikiUrl}/new/?d=${rawTitle})해 주세요.`, '']]
        }
        
        const googleSheetUrl3 = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/`
        var sheetData3 = await fetch(googleSheetUrl3, googleSheetParam)
        var sheetRes3 = await sheetData3.json()
        var wikiListArray = sheetRes3.sheets
        var wikiList = []
        for (let i=0; i<wikiListArray.length; i++) {
            wikiList.push(wikiListArray[i].properties.title)
        }

        return { wikiTitle, rawTitle, wikiBody, sheetId, clientId, wikiUrl, wikiList }
    }
}
</script>
