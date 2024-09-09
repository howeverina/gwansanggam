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
                    <h1 id="doc-title">새 문서 생성</h1>
                </div>
                <div id="content-box">
                    <div id="content"></div>
                    <div id="sheetId" :class="sheetId"></div>
                    <div id="wikiList" style="display: none;">{{ wikiList }}</div>
                </div>
                <div id="footer">
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
        meta: [
        {"http-equiv": "Content-Security-Policy"},
        {content: "upgrade-insecure-requests"}
        ],
      script: [
        { src: 'js/new.js', defer: true },
      ],
      link: [
        { href: 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css', rel: 'stylesheet'},
        { href: 'css/main.css', rel: 'stylesheet'}
      ]
    }
  },
    async asyncData ({ $config: { wikiUrl }, $config: { wikiTitle }, $config: { sheetId }, $config: { clientEmail }, $config: { privateKey }, $config: { privateKeyId }}) {

        wikiUrl = 'https://'+wikiUrl

        var secretKey = privateKey.replace(/\\n/gm, '\n')

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

        const googleSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/`
        const googleSheetParam = {
            method: 'GET',
            headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + authRes.access_token,
            },
        }
        var sheetData3 = await fetch(googleSheetUrl, googleSheetParam)
        var sheetRes3 = await sheetData3.json()
        var wikiListArray = sheetRes3.sheets
        var wikiList = []
        for (let i=0; i<wikiListArray.length; i++) {
            wikiList.push(wikiListArray[i].properties.title)
        }
        return { wikiTitle, wikiUrl, sheetId, wikiList }
    }
}
</script>
