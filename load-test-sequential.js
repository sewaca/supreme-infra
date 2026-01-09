import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import http from 'k6/http';

const baseUrl = 'http://84.252.134.216';
const loggerUrl = 'http://localhost:3001/register';
const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0';

const loginUsers = new SharedArray('loginUsers', () => {
  const users = [
    { email: 'admin@example.com', password: 'admin@example.com', name: '' },
    { email: 'testuser1@example.com', password: 'testuser1@example.com', name: '' },
    { email: 'testuser2@example.com', password: 'testuser2@example.com', name: '' },
    { email: 'testuser3@example.com', password: 'testuser3@example.com', name: '' },
    { email: 'testuser4@example.com', password: 'testuser4@example.com', name: '' },
    {
      email: 'loadtestreg1767969352638Rt9Ghy@example.com',
      password: 'loadtestreg1767969352638Rt9Ghy@example.com',
      name: 'loadtestreg1767969352638Rt9Ghy@example.com',
    },
    {
      email: 'loadtestreg1767969352684ReUGvG@example.com',
      password: 'loadtestreg1767969352684ReUGvG@example.com',
      name: 'loadtestreg1767969352684ReUGvG@example.com',
    },
    {
      email: 'loadtestreg1767969352671sbeWYh@example.com',
      password: 'loadtestreg1767969352671sbeWYh@example.com',
      name: 'loadtestreg1767969352671sbeWYh@example.com',
    },
    {
      email: 'loadtestreg1767969352658CpVcqc@example.com',
      password: 'loadtestreg1767969352658CpVcqc@example.com',
      name: 'loadtestreg1767969352658CpVcqc@example.com',
    },
    {
      email: 'loadtestreg1767969352831Ru3Bbg@example.com',
      password: 'loadtestreg1767969352831Ru3Bbg@example.com',
      name: 'loadtestreg1767969352831Ru3Bbg@example.com',
    },
    {
      email: 'loadtestreg1767969352678VaLOim@example.com',
      password: 'loadtestreg1767969352678VaLOim@example.com',
      name: 'loadtestreg1767969352678VaLOim@example.com',
    },
    {
      email: 'loadtestreg17679693529649kldVm@example.com',
      password: 'loadtestreg17679693529649kldVm@example.com',
      name: 'loadtestreg17679693529649kldVm@example.com',
    },
    {
      email: 'loadtestreg17679693537374ZNIKs@example.com',
      password: 'loadtestreg17679693537374ZNIKs@example.com',
      name: 'loadtestreg17679693537374ZNIKs@example.com',
    },
    {
      email: 'loadtestreg1767969352904L4Bys7@example.com',
      password: 'loadtestreg1767969352904L4Bys7@example.com',
      name: 'loadtestreg1767969352904L4Bys7@example.com',
    },
    {
      email: 'loadtestreg1767969352645xgoW7A@example.com',
      password: 'loadtestreg1767969352645xgoW7A@example.com',
      name: 'loadtestreg1767969352645xgoW7A@example.com',
    },
    {
      email: 'loadtestreg1767969353004dHPzmn@example.com',
      password: 'loadtestreg1767969353004dHPzmn@example.com',
      name: 'loadtestreg1767969353004dHPzmn@example.com',
    },
    {
      email: 'loadtestreg1767969352984G7Jab5@example.com',
      password: 'loadtestreg1767969352984G7Jab5@example.com',
      name: 'loadtestreg1767969352984G7Jab5@example.com',
    },
    {
      email: 'loadtestreg17679693527186v47Ri@example.com',
      password: 'loadtestreg17679693527186v47Ri@example.com',
      name: 'loadtestreg17679693527186v47Ri@example.com',
    },
    {
      email: 'loadtestreg1767969353024OXW3AG@example.com',
      password: 'loadtestreg1767969353024OXW3AG@example.com',
      name: 'loadtestreg1767969353024OXW3AG@example.com',
    },
    {
      email: 'loadtestreg1767969352698eDQtDQ@example.com',
      password: 'loadtestreg1767969352698eDQtDQ@example.com',
      name: 'loadtestreg1767969352698eDQtDQ@example.com',
    },
    {
      email: 'loadtestreg1767969354097XuBJVA@example.com',
      password: 'loadtestreg1767969354097XuBJVA@example.com',
      name: 'loadtestreg1767969354097XuBJVA@example.com',
    },
    {
      email: 'loadtestreg1767969353031ZHzqvC@example.com',
      password: 'loadtestreg1767969353031ZHzqvC@example.com',
      name: 'loadtestreg1767969353031ZHzqvC@example.com',
    },
    {
      email: 'loadtestreg1767969352797cOG7jB@example.com',
      password: 'loadtestreg1767969352797cOG7jB@example.com',
      name: 'loadtestreg1767969352797cOG7jB@example.com',
    },
    {
      email: 'loadtestreg1767969353077EX4wKb@example.com',
      password: 'loadtestreg1767969353077EX4wKb@example.com',
      name: 'loadtestreg1767969353077EX4wKb@example.com',
    },
    {
      email: 'loadtestreg1767969352724bCgoi9@example.com',
      password: 'loadtestreg1767969352724bCgoi9@example.com',
      name: 'loadtestreg1767969352724bCgoi9@example.com',
    },
    {
      email: 'loadtestreg1767969352711KaCUN9@example.com',
      password: 'loadtestreg1767969352711KaCUN9@example.com',
      name: 'loadtestreg1767969352711KaCUN9@example.com',
    },
    {
      email: 'loadtestreg1767969354391wxRydB@example.com',
      password: 'loadtestreg1767969354391wxRydB@example.com',
      name: 'loadtestreg1767969354391wxRydB@example.com',
    },
    {
      email: 'loadtestreg1767969353011yLx20Z@example.com',
      password: 'loadtestreg1767969353011yLx20Z@example.com',
      name: 'loadtestreg1767969353011yLx20Z@example.com',
    },
    {
      email: 'loadtestreg1767969353037QEGIEV@example.com',
      password: 'loadtestreg1767969353037QEGIEV@example.com',
      name: 'loadtestreg1767969353037QEGIEV@example.com',
    },
    {
      email: 'loadtestreg1767969353097VO9FMH@example.com',
      password: 'loadtestreg1767969353097VO9FMH@example.com',
      name: 'loadtestreg1767969353097VO9FMH@example.com',
    },
    {
      email: 'loadtestreg1767969352778Yf3lRJ@example.com',
      password: 'loadtestreg1767969352778Yf3lRJ@example.com',
      name: 'loadtestreg1767969352778Yf3lRJ@example.com',
    },
    {
      email: 'loadtestreg1767969353937N3jChr@example.com',
      password: 'loadtestreg1767969353937N3jChr@example.com',
      name: 'loadtestreg1767969353937N3jChr@example.com',
    },
    {
      email: 'loadtestreg1767969353778tTFg0z@example.com',
      password: 'loadtestreg1767969353778tTFg0z@example.com',
      name: 'loadtestreg1767969353778tTFg0z@example.com',
    },
    {
      email: 'loadtestreg17679693530441Slrgu@example.com',
      password: 'loadtestreg17679693530441Slrgu@example.com',
      name: 'loadtestreg17679693530441Slrgu@example.com',
    },
    {
      email: 'loadtestreg17679693529718t8w0M@example.com',
      password: 'loadtestreg17679693529718t8w0M@example.com',
      name: 'loadtestreg17679693529718t8w0M@example.com',
    },
    {
      email: 'loadtestreg176796935306475ORRb@example.com',
      password: 'loadtestreg176796935306475ORRb@example.com',
      name: 'loadtestreg176796935306475ORRb@example.com',
    },
    {
      email: 'loadtestreg1767969353017ZQdGcd@example.com',
      password: 'loadtestreg1767969353017ZQdGcd@example.com',
      name: 'loadtestreg1767969353017ZQdGcd@example.com',
    },
    {
      email: 'loadtestreg1767969353051AwDDxp@example.com',
      password: 'loadtestreg1767969353051AwDDxp@example.com',
      name: 'loadtestreg1767969353051AwDDxp@example.com',
    },
    {
      email: 'loadtestreg17679693531178X0mHp@example.com',
      password: 'loadtestreg17679693531178X0mHp@example.com',
      name: 'loadtestreg17679693531178X0mHp@example.com',
    },
    {
      email: 'loadtestreg1767969353164pL5U2N@example.com',
      password: 'loadtestreg1767969353164pL5U2N@example.com',
      name: 'loadtestreg1767969353164pL5U2N@example.com',
    },
    {
      email: 'loadtestreg1767969353178JSEx5w@example.com',
      password: 'loadtestreg1767969353178JSEx5w@example.com',
      name: 'loadtestreg1767969353178JSEx5w@example.com',
    },
    {
      email: 'loadtestreg1767969352737FA1IN7@example.com',
      password: 'loadtestreg1767969352737FA1IN7@example.com',
      name: 'loadtestreg1767969352737FA1IN7@example.com',
    },
    {
      email: 'loadtestreg1767969355177M13AYs@example.com',
      password: 'loadtestreg1767969355177M13AYs@example.com',
      name: 'loadtestreg1767969355177M13AYs@example.com',
    },
    {
      email: 'loadtestreg1767969354417NgKLcM@example.com',
      password: 'loadtestreg1767969354417NgKLcM@example.com',
      name: 'loadtestreg1767969354417NgKLcM@example.com',
    },
    {
      email: 'loadtestreg1767969353071BgmJXs@example.com',
      password: 'loadtestreg1767969353071BgmJXs@example.com',
      name: 'loadtestreg1767969353071BgmJXs@example.com',
    },
    {
      email: 'loadtestreg1767969353084mTrRuw@example.com',
      password: 'loadtestreg1767969353084mTrRuw@example.com',
      name: 'loadtestreg1767969353084mTrRuw@example.com',
    },
    {
      email: 'loadtestreg1767969352664pN0FHf@example.com',
      password: 'loadtestreg1767969352664pN0FHf@example.com',
      name: 'loadtestreg1767969352664pN0FHf@example.com',
    },
    {
      email: 'loadtestreg1767969353091yTTUKc@example.com',
      password: 'loadtestreg1767969353091yTTUKc@example.com',
      name: 'loadtestreg1767969353091yTTUKc@example.com',
    },
    {
      email: 'loadtestreg1767969352691cDxQXF@example.com',
      password: 'loadtestreg1767969352691cDxQXF@example.com',
      name: 'loadtestreg1767969352691cDxQXF@example.com',
    },
    {
      email: 'loadtestreg1767969353257WT8uzi@example.com',
      password: 'loadtestreg1767969353257WT8uzi@example.com',
      name: 'loadtestreg1767969353257WT8uzi@example.com',
    },
    {
      email: 'loadtestreg1767969355458qQvzZp@example.com',
      password: 'loadtestreg1767969355458qQvzZp@example.com',
      name: 'loadtestreg1767969355458qQvzZp@example.com',
    },
    {
      email: 'loadtestreg1767969355058M0bKxF@example.com',
      password: 'loadtestreg1767969355058M0bKxF@example.com',
      name: 'loadtestreg1767969355058M0bKxF@example.com',
    },
    {
      email: 'loadtestreg17679693531043Lk2ir@example.com',
      password: 'loadtestreg17679693531043Lk2ir@example.com',
      name: 'loadtestreg17679693531043Lk2ir@example.com',
    },
    {
      email: 'loadtestreg1767969353125vlzFws@example.com',
      password: 'loadtestreg1767969353125vlzFws@example.com',
      name: 'loadtestreg1767969353125vlzFws@example.com',
    },
    {
      email: 'loadtestreg1767969352784c5pLG3@example.com',
      password: 'loadtestreg1767969352784c5pLG3@example.com',
      name: 'loadtestreg1767969352784c5pLG3@example.com',
    },
    {
      email: 'loadtestreg1767969355784CR3JeR@example.com',
      password: 'loadtestreg1767969355784CR3JeR@example.com',
      name: 'loadtestreg1767969355784CR3JeR@example.com',
    },
    {
      email: 'loadtestreg1767969353111Xn65oc@example.com',
      password: 'loadtestreg1767969353111Xn65oc@example.com',
      name: 'loadtestreg1767969353111Xn65oc@example.com',
    },
    {
      email: 'loadtestreg1767969356018yrA6YG@example.com',
      password: 'loadtestreg1767969356018yrA6YG@example.com',
      name: 'loadtestreg1767969356018yrA6YG@example.com',
    },
    {
      email: 'loadtestreg1767969352651jwkUHf@example.com',
      password: 'loadtestreg1767969352651jwkUHf@example.com',
      name: 'loadtestreg1767969352651jwkUHf@example.com',
    },
    {
      email: 'loadtestreg17679693530573uXkjL@example.com',
      password: 'loadtestreg17679693530573uXkjL@example.com',
      name: 'loadtestreg17679693530573uXkjL@example.com',
    },
    {
      email: 'loadtestreg17679693545314mfhCP@example.com',
      password: 'loadtestreg17679693545314mfhCP@example.com',
      name: 'loadtestreg17679693545314mfhCP@example.com',
    },
    {
      email: 'loadtestreg1767969352632hyy5HN@example.com',
      password: 'loadtestreg1767969352632hyy5HN@example.com',
      name: 'loadtestreg1767969352632hyy5HN@example.com',
    },
    {
      email: 'loadtestreg1767969352758bDrcxE@example.com',
      password: 'loadtestreg1767969352758bDrcxE@example.com',
      name: 'loadtestreg1767969352758bDrcxE@example.com',
    },
    {
      email: 'loadtestreg1767969352817eqB2LZ@example.com',
      password: 'loadtestreg1767969352817eqB2LZ@example.com',
      name: 'loadtestreg1767969352817eqB2LZ@example.com',
    },
    {
      email: 'loadtestreg1767969353191a4BOeC@example.com',
      password: 'loadtestreg1767969353191a4BOeC@example.com',
      name: 'loadtestreg1767969353191a4BOeC@example.com',
    },
    {
      email: 'loadtestreg1767969353137e03eI9@example.com',
      password: 'loadtestreg1767969353137e03eI9@example.com',
      name: 'loadtestreg1767969353137e03eI9@example.com',
    },
    {
      email: 'loadtestreg1767969354678jOiLGx@example.com',
      password: 'loadtestreg1767969354678jOiLGx@example.com',
      name: 'loadtestreg1767969354678jOiLGx@example.com',
    },
    {
      email: 'loadtestreg1767969352704tXF0No@example.com',
      password: 'loadtestreg1767969352704tXF0No@example.com',
      name: 'loadtestreg1767969352704tXF0No@example.com',
    },
    {
      email: 'loadtestreg1767969353151InZsWI@example.com',
      password: 'loadtestreg1767969353151InZsWI@example.com',
      name: 'loadtestreg1767969353151InZsWI@example.com',
    },
    {
      email: 'loadtestreg1767969352804kQcdRh@example.com',
      password: 'loadtestreg1767969352804kQcdRh@example.com',
      name: 'loadtestreg1767969352804kQcdRh@example.com',
    },
    {
      email: 'loadtestreg1767969352891BoyPpC@example.com',
      password: 'loadtestreg1767969352891BoyPpC@example.com',
      name: 'loadtestreg1767969352891BoyPpC@example.com',
    },
    {
      email: 'loadtestreg1767969352771UZNrsS@example.com',
      password: 'loadtestreg1767969352771UZNrsS@example.com',
      name: 'loadtestreg1767969352771UZNrsS@example.com',
    },
    {
      email: 'loadtestreg1767969353218qCmf3u@example.com',
      password: 'loadtestreg1767969353218qCmf3u@example.com',
      name: 'loadtestreg1767969353218qCmf3u@example.com',
    },
    {
      email: 'loadtestreg1767969352871whfxQt@example.com',
      password: 'loadtestreg1767969352871whfxQt@example.com',
      name: 'loadtestreg1767969352871whfxQt@example.com',
    },
    {
      email: 'loadtestreg17679693527511FkLwV@example.com',
      password: 'loadtestreg17679693527511FkLwV@example.com',
      name: 'loadtestreg17679693527511FkLwV@example.com',
    },
    {
      email: 'loadtestreg1767969353244LEwsWe@example.com',
      password: 'loadtestreg1767969353244LEwsWe@example.com',
      name: 'loadtestreg1767969353244LEwsWe@example.com',
    },
    {
      email: 'loadtestreg17679693546913lS5BP@example.com',
      password: 'loadtestreg17679693546913lS5BP@example.com',
      name: 'loadtestreg17679693546913lS5BP@example.com',
    },
    {
      email: 'loadtestreg1767969353298n7KdKS@example.com',
      password: 'loadtestreg1767969353298n7KdKS@example.com',
      name: 'loadtestreg1767969353298n7KdKS@example.com',
    },
    {
      email: 'loadtestreg1767969352944DcTGhv@example.com',
      password: 'loadtestreg1767969352944DcTGhv@example.com',
      name: 'loadtestreg1767969352944DcTGhv@example.com',
    },
    {
      email: 'loadtestreg1767969358277RsLt5E@example.com',
      password: 'loadtestreg1767969358277RsLt5E@example.com',
      name: 'loadtestreg1767969358277RsLt5E@example.com',
    },
    {
      email: 'loadtestreg1767969358271jhRB5S@example.com',
      password: 'loadtestreg1767969358271jhRB5S@example.com',
      name: 'loadtestreg1767969358271jhRB5S@example.com',
    },
    {
      email: 'loadtestreg1767969358124WO7DIp@example.com',
      password: 'loadtestreg1767969358124WO7DIp@example.com',
      name: 'loadtestreg1767969358124WO7DIp@example.com',
    },
    {
      email: 'loadtestreg17679693532049eDKus@example.com',
      password: 'loadtestreg17679693532049eDKus@example.com',
      name: 'loadtestreg17679693532049eDKus@example.com',
    },
    {
      email: 'loadtestreg1767969353231a915Xq@example.com',
      password: 'loadtestreg1767969353231a915Xq@example.com',
      name: 'loadtestreg1767969353231a915Xq@example.com',
    },
    {
      email: 'loadtestreg1767969352731cKOCbG@example.com',
      password: 'loadtestreg1767969352731cKOCbG@example.com',
      name: 'loadtestreg1767969352731cKOCbG@example.com',
    },
    {
      email: 'loadtestreg1767969352858yoQAjp@example.com',
      password: 'loadtestreg1767969352858yoQAjp@example.com',
      name: 'loadtestreg1767969352858yoQAjp@example.com',
    },
    {
      email: 'loadtestreg1767969352911LNUnnt@example.com',
      password: 'loadtestreg1767969352911LNUnnt@example.com',
      name: 'loadtestreg1767969352911LNUnnt@example.com',
    },
    {
      email: 'loadtestreg1767969352878NYiXZy@example.com',
      password: 'loadtestreg1767969352878NYiXZy@example.com',
      name: 'loadtestreg1767969352878NYiXZy@example.com',
    },
    {
      email: 'loadtestreg1767969354911qUQxzN@example.com',
      password: 'loadtestreg1767969354911qUQxzN@example.com',
      name: 'loadtestreg1767969354911qUQxzN@example.com',
    },
    {
      email: 'loadtestreg1767969358131XwfpXr@example.com',
      password: 'loadtestreg1767969358131XwfpXr@example.com',
      name: 'loadtestreg1767969358131XwfpXr@example.com',
    },
    {
      email: 'loadtestreg1767969353337mJvVZr@example.com',
      password: 'loadtestreg1767969353337mJvVZr@example.com',
      name: 'loadtestreg1767969353337mJvVZr@example.com',
    },
    {
      email: 'loadtestreg1767969358284LwQHF9@example.com',
      password: 'loadtestreg1767969358284LwQHF9@example.com',
      name: 'loadtestreg1767969358284LwQHF9@example.com',
    },
    {
      email: 'loadtestreg1767969352744Tg5G79@example.com',
      password: 'loadtestreg1767969352744Tg5G79@example.com',
      name: 'loadtestreg1767969352744Tg5G79@example.com',
    },
    {
      email: 'loadtestreg17679693529388uqwqp@example.com',
      password: 'loadtestreg17679693529388uqwqp@example.com',
      name: 'loadtestreg17679693529388uqwqp@example.com',
    },
    {
      email: 'loadtestreg1767969352884iqlO8a@example.com',
      password: 'loadtestreg1767969352884iqlO8a@example.com',
      name: 'loadtestreg1767969352884iqlO8a@example.com',
    },
    {
      email: 'loadtestreg17679693528254KSwgC@example.com',
      password: 'loadtestreg17679693528254KSwgC@example.com',
      name: 'loadtestreg17679693528254KSwgC@example.com',
    },
    {
      email: 'loadtestreg1767969352991jO5Y37@example.com',
      password: 'loadtestreg1767969352991jO5Y37@example.com',
      name: 'loadtestreg1767969352991jO5Y37@example.com',
    },
    {
      email: 'loadtestreg1767969352851y8O1Sp@example.com',
      password: 'loadtestreg1767969352851y8O1Sp@example.com',
      name: 'loadtestreg1767969352851y8O1Sp@example.com',
    },
    {
      email: 'loadtestreg17679693527910ZCMfC@example.com',
      password: 'loadtestreg17679693527910ZCMfC@example.com',
      name: 'loadtestreg17679693527910ZCMfC@example.com',
    },
    {
      email: 'loadtestreg17679693558111aA7zd@example.com',
      password: 'loadtestreg17679693558111aA7zd@example.com',
      name: 'loadtestreg17679693558111aA7zd@example.com',
    },
    {
      email: 'loadtestreg1767969352838d0JJwJ@example.com',
      password: 'loadtestreg1767969352838d0JJwJ@example.com',
      name: 'loadtestreg1767969352838d0JJwJ@example.com',
    },
    {
      email: 'loadtestreg1767969353311yZ2xBY@example.com',
      password: 'loadtestreg1767969353311yZ2xBY@example.com',
      name: 'loadtestreg1767969353311yZ2xBY@example.com',
    },
    {
      email: 'loadtestreg1767969353353q4rOgE@example.com',
      password: 'loadtestreg1767969353353q4rOgE@example.com',
      name: 'loadtestreg1767969353353q4rOgE@example.com',
    },
    {
      email: 'loadtestreg1767969358311ARFmfM@example.com',
      password: 'loadtestreg1767969358311ARFmfM@example.com',
      name: 'loadtestreg1767969358311ARFmfM@example.com',
    },
    {
      email: 'loadtestreg17679693573249T1tnP@example.com',
      password: 'loadtestreg17679693573249T1tnP@example.com',
      name: 'loadtestreg17679693573249T1tnP@example.com',
    },
    {
      email: 'loadtestreg1767969353284BCCdSw@example.com',
      password: 'loadtestreg1767969353284BCCdSw@example.com',
      name: 'loadtestreg1767969353284BCCdSw@example.com',
    },
    {
      email: 'loadtestreg1767969352917AttTEH@example.com',
      password: 'loadtestreg1767969352917AttTEH@example.com',
      name: 'loadtestreg1767969352917AttTEH@example.com',
    },
    {
      email: 'loadtestreg1767969352844njsVEH@example.com',
      password: 'loadtestreg1767969352844njsVEH@example.com',
      name: 'loadtestreg1767969352844njsVEH@example.com',
    },
    {
      email: 'loadtestreg1767969352764ubIH9X@example.com',
      password: 'loadtestreg1767969352764ubIH9X@example.com',
      name: 'loadtestreg1767969352764ubIH9X@example.com',
    },
    {
      email: 'loadtestreg1767969355257ZDDNWS@example.com',
      password: 'loadtestreg1767969355257ZDDNWS@example.com',
      name: 'loadtestreg1767969355257ZDDNWS@example.com',
    },
    {
      email: 'loadtestreg1767969353271erYc4c@example.com',
      password: 'loadtestreg1767969353271erYc4c@example.com',
      name: 'loadtestreg1767969353271erYc4c@example.com',
    },
    {
      email: 'loadtestreg1767969353418rvXhgd@example.com',
      password: 'loadtestreg1767969353418rvXhgd@example.com',
      name: 'loadtestreg1767969353418rvXhgd@example.com',
    },
    {
      email: 'loadtestreg1767969358438HONwEX@example.com',
      password: 'loadtestreg1767969358438HONwEX@example.com',
      name: 'loadtestreg1767969358438HONwEX@example.com',
    },
    {
      email: 'loadtestreg1767969353324R4vTfU@example.com',
      password: 'loadtestreg1767969353324R4vTfU@example.com',
      name: 'loadtestreg1767969353324R4vTfU@example.com',
    },
    {
      email: 'loadtestreg1767969352864tNeN3e@example.com',
      password: 'loadtestreg1767969352864tNeN3e@example.com',
      name: 'loadtestreg1767969352864tNeN3e@example.com',
    },
    {
      email: 'loadtestreg1767969360077ssc6x9@example.com',
      password: 'loadtestreg1767969360077ssc6x9@example.com',
      name: 'loadtestreg1767969360077ssc6x9@example.com',
    },
    {
      email: 'loadtestreg1767969353431Xdrvxd@example.com',
      password: 'loadtestreg1767969353431Xdrvxd@example.com',
      name: 'loadtestreg1767969353431Xdrvxd@example.com',
    },
    {
      email: 'loadtestreg1767969357251Mjrcwf@example.com',
      password: 'loadtestreg1767969357251Mjrcwf@example.com',
      name: 'loadtestreg1767969357251Mjrcwf@example.com',
    },
    {
      email: 'loadtestreg1767969352924hBy2l9@example.com',
      password: 'loadtestreg1767969352924hBy2l9@example.com',
      name: 'loadtestreg1767969352924hBy2l9@example.com',
    },
    {
      email: 'loadtestreg1767969359124XxEgTw@example.com',
      password: 'loadtestreg1767969359124XxEgTw@example.com',
      name: 'loadtestreg1767969359124XxEgTw@example.com',
    },
    {
      email: 'loadtestreg1767969353404nCTlc4@example.com',
      password: 'loadtestreg1767969353404nCTlc4@example.com',
      name: 'loadtestreg1767969353404nCTlc4@example.com',
    },
    {
      email: 'loadtestreg1767969357317GyquaN@example.com',
      password: 'loadtestreg1767969357317GyquaN@example.com',
      name: 'loadtestreg1767969357317GyquaN@example.com',
    },
    {
      email: 'loadtestreg1767969360085iaxjq9@example.com',
      password: 'loadtestreg1767969360085iaxjq9@example.com',
      name: 'loadtestreg1767969360085iaxjq9@example.com',
    },
    {
      email: 'loadtestreg1767969353364NbaZv0@example.com',
      password: 'loadtestreg1767969353364NbaZv0@example.com',
      name: 'loadtestreg1767969353364NbaZv0@example.com',
    },
    {
      email: 'loadtestreg1767969359264g7hLLa@example.com',
      password: 'loadtestreg1767969359264g7hLLa@example.com',
      name: 'loadtestreg1767969359264g7hLLa@example.com',
    },
    {
      email: 'loadtestreg1767969360364gE3i0P@example.com',
      password: 'loadtestreg1767969360364gE3i0P@example.com',
      name: 'loadtestreg1767969360364gE3i0P@example.com',
    },
    {
      email: 'loadtestreg1767969358457PSGvkb@example.com',
      password: 'loadtestreg1767969358457PSGvkb@example.com',
      name: 'loadtestreg1767969358457PSGvkb@example.com',
    },
    {
      email: 'loadtestreg1767969353537JsJZ90@example.com',
      password: 'loadtestreg1767969353537JsJZ90@example.com',
      name: 'loadtestreg1767969353537JsJZ90@example.com',
    },
    {
      email: 'loadtestreg1767969352951CMQ5aT@example.com',
      password: 'loadtestreg1767969352951CMQ5aT@example.com',
      name: 'loadtestreg1767969352951CMQ5aT@example.com',
    },
    {
      email: 'loadtestreg1767969360585PtKQVW@example.com',
      password: 'loadtestreg1767969360585PtKQVW@example.com',
      name: 'loadtestreg1767969360585PtKQVW@example.com',
    },
    {
      email: 'loadtestreg1767969353524ZrkTGL@example.com',
      password: 'loadtestreg1767969353524ZrkTGL@example.com',
      name: 'loadtestreg1767969353524ZrkTGL@example.com',
    },
    {
      email: 'loadtestreg1767969360671BOoA5J@example.com',
      password: 'loadtestreg1767969360671BOoA5J@example.com',
      name: 'loadtestreg1767969360671BOoA5J@example.com',
    },
    {
      email: 'loadtestreg1767969353391r1xo46@example.com',
      password: 'loadtestreg1767969353391r1xo46@example.com',
      name: 'loadtestreg1767969353391r1xo46@example.com',
    },
    {
      email: 'loadtestreg1767969352897vi4ULA@example.com',
      password: 'loadtestreg1767969352897vi4ULA@example.com',
      name: 'loadtestreg1767969352897vi4ULA@example.com',
    },
    {
      email: 'loadtestreg17679693535110Mk2uN@example.com',
      password: 'loadtestreg17679693535110Mk2uN@example.com',
      name: 'loadtestreg17679693535110Mk2uN@example.com',
    },
    {
      email: 'loadtestreg176796935600464pBCZ@example.com',
      password: 'loadtestreg176796935600464pBCZ@example.com',
      name: 'loadtestreg176796935600464pBCZ@example.com',
    },
    {
      email: 'loadtestreg1767969353457Wd0mY5@example.com',
      password: 'loadtestreg1767969353457Wd0mY5@example.com',
      name: 'loadtestreg1767969353457Wd0mY5@example.com',
    },
    {
      email: 'loadtestreg1767969361104FqY2sL@example.com',
      password: 'loadtestreg1767969361104FqY2sL@example.com',
      name: 'loadtestreg1767969361104FqY2sL@example.com',
    },
    {
      email: 'loadtestreg1767969361871B7JK2Q@example.com',
      password: 'loadtestreg1767969361871B7JK2Q@example.com',
      name: 'loadtestreg1767969361871B7JK2Q@example.com',
    },
    {
      email: 'loadtestreg1767969359237EL9Hhk@example.com',
      password: 'loadtestreg1767969359237EL9Hhk@example.com',
      name: 'loadtestreg1767969359237EL9Hhk@example.com',
    },
    {
      email: 'loadtestreg1767969353484CasZPS@example.com',
      password: 'loadtestreg1767969353484CasZPS@example.com',
      name: 'loadtestreg1767969353484CasZPS@example.com',
    },
    {
      email: 'loadtestreg17679693610370BWLmi@example.com',
      password: 'loadtestreg17679693610370BWLmi@example.com',
      name: 'loadtestreg17679693610370BWLmi@example.com',
    },
    {
      email: 'loadtestreg1767969360591qmFFEf@example.com',
      password: 'loadtestreg1767969360591qmFFEf@example.com',
      name: 'loadtestreg1767969360591qmFFEf@example.com',
    },
    {
      email: 'loadtestreg1767969361591O5wYWo@example.com',
      password: 'loadtestreg1767969361591O5wYWo@example.com',
      name: 'loadtestreg1767969361591O5wYWo@example.com',
    },
    {
      email: 'loadtestreg1767969361584HHTRUR@example.com',
      password: 'loadtestreg1767969361584HHTRUR@example.com',
      name: 'loadtestreg1767969361584HHTRUR@example.com',
    },
    {
      email: 'loadtestreg1767969353604wj9TS2@example.com',
      password: 'loadtestreg1767969353604wj9TS2@example.com',
      name: 'loadtestreg1767969353604wj9TS2@example.com',
    },
    {
      email: 'loadtestreg1767969360177Nov7qj@example.com',
      password: 'loadtestreg1767969360177Nov7qj@example.com',
      name: 'loadtestreg1767969360177Nov7qj@example.com',
    },
    {
      email: 'loadtestreg1767969361484cBE6rG@example.com',
      password: 'loadtestreg1767969361484cBE6rG@example.com',
      name: 'loadtestreg1767969361484cBE6rG@example.com',
    },
    {
      email: 'loadtestreg1767969358784kp9xNI@example.com',
      password: 'loadtestreg1767969358784kp9xNI@example.com',
      name: 'loadtestreg1767969358784kp9xNI@example.com',
    },
    {
      email: 'loadtestreg1767969352977NwAjCk@example.com',
      password: 'loadtestreg1767969352977NwAjCk@example.com',
      name: 'loadtestreg1767969352977NwAjCk@example.com',
    },
    {
      email: 'loadtestreg1767969360271N0uzye@example.com',
      password: 'loadtestreg1767969360271N0uzye@example.com',
      name: 'loadtestreg1767969360271N0uzye@example.com',
    },
    {
      email: 'loadtestreg1767969352931WeXO1V@example.com',
      password: 'loadtestreg1767969352931WeXO1V@example.com',
      name: 'loadtestreg1767969352931WeXO1V@example.com',
    },
    {
      email: 'loadtestreg17679693575512WsBlU@example.com',
      password: 'loadtestreg17679693575512WsBlU@example.com',
      name: 'loadtestreg17679693575512WsBlU@example.com',
    },
    {
      email: 'loadtestreg17679693528116qNxGL@example.com',
      password: 'loadtestreg17679693528116qNxGL@example.com',
      name: 'loadtestreg17679693528116qNxGL@example.com',
    },
    {
      email: 'loadtestreg1767969352997MOPVM3@example.com',
      password: 'loadtestreg1767969352997MOPVM3@example.com',
      name: 'loadtestreg1767969352997MOPVM3@example.com',
    },
    {
      email: 'loadtestreg1767969352957sLxtPU@example.com',
      password: 'loadtestreg1767969352957sLxtPU@example.com',
      name: 'loadtestreg1767969352957sLxtPU@example.com',
    },
    {
      email: 'loadtestreg1767969362071YKHV5o@example.com',
      password: 'loadtestreg1767969362071YKHV5o@example.com',
      name: 'loadtestreg1767969362071YKHV5o@example.com',
    },
    {
      email: 'loadtestreg1767969361764MInn4L@example.com',
      password: 'loadtestreg1767969361764MInn4L@example.com',
      name: 'loadtestreg1767969361764MInn4L@example.com',
    },
    {
      email: 'loadtestreg17679693612573UE1IH@example.com',
      password: 'loadtestreg17679693612573UE1IH@example.com',
      name: 'loadtestreg17679693612573UE1IH@example.com',
    },
    {
      email: 'loadtestreg1767969353618MyWbWD@example.com',
      password: 'loadtestreg1767969353618MyWbWD@example.com',
      name: 'loadtestreg1767969353618MyWbWD@example.com',
    },
    {
      email: 'loadtestreg1767969359584Fmpwnz@example.com',
      password: 'loadtestreg1767969359584Fmpwnz@example.com',
      name: 'loadtestreg1767969359584Fmpwnz@example.com',
    },
    {
      email: 'loadtestreg1767969359471B9qbpw@example.com',
      password: 'loadtestreg1767969359471B9qbpw@example.com',
      name: 'loadtestreg1767969359471B9qbpw@example.com',
    },
    {
      email: 'loadtestreg1767969353498eAxHLn@example.com',
      password: 'loadtestreg1767969353498eAxHLn@example.com',
      name: 'loadtestreg1767969353498eAxHLn@example.com',
    },
    {
      email: 'loadtestreg17679693620649RzpfT@example.com',
      password: 'loadtestreg17679693620649RzpfT@example.com',
      name: 'loadtestreg17679693620649RzpfT@example.com',
    },
    {
      email: 'loadtestreg17679693584511uqk0B@example.com',
      password: 'loadtestreg17679693584511uqk0B@example.com',
      name: 'loadtestreg17679693584511uqk0B@example.com',
    },
    {
      email: 'loadtestreg176796936147759lj4H@example.com',
      password: 'loadtestreg176796936147759lj4H@example.com',
      name: 'loadtestreg176796936147759lj4H@example.com',
    },
    {
      email: 'loadtestreg1767969353564dw3WIF@example.com',
      password: 'loadtestreg1767969353564dw3WIF@example.com',
      name: 'loadtestreg1767969353564dw3WIF@example.com',
    },
    {
      email: 'loadtestreg1767969353551z1C33i@example.com',
      password: 'loadtestreg1767969353551z1C33i@example.com',
      name: 'loadtestreg1767969353551z1C33i@example.com',
    },
    {
      email: 'loadtestreg1767969361377Vump9I@example.com',
      password: 'loadtestreg1767969361377Vump9I@example.com',
      name: 'loadtestreg1767969361377Vump9I@example.com',
    },
    {
      email: 'loadtestreg1767969353377OxmmNR@example.com',
      password: 'loadtestreg1767969353377OxmmNR@example.com',
      name: 'loadtestreg1767969353377OxmmNR@example.com',
    },
  ];
  return users.slice(0, 100);
});

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueEmail() {
  const timestamp = Date.now();
  const randomStr = generateRandomString(6);
  return `loadtestreg${timestamp}${randomStr}@example.com`;
}

export const options = {
  scenarios: {
    register: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '1m',
      startTime: '0s',
      preAllocatedVUs: 100,
      maxVUs: 400,
      tags: { scenario: 'register' },
    },
    login: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 100,
      maxVUs: 400,
      tags: { scenario: 'login' },
    },
    homepage: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '5m',
      startTime: '8m',
      preAllocatedVUs: 100,
      maxVUs: 400,
      tags: { scenario: 'homepage' },
    },
    recipes_random: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '5m',
      startTime: '14m',
      preAllocatedVUs: 100,
      maxVUs: 400,
      tags: { scenario: 'recipes' },
    },
  },
  thresholds: {
    'http_req_duration{scenario:register}': ['p(95)<2000'],
    'http_req_failed{scenario:register}': ['rate<0.01'],
    'http_req_duration{scenario:login}': ['p(95)<2000'],
    'http_req_failed{scenario:login}': ['rate<0.01'],
    'http_req_duration{scenario:homepage}': ['p(95)<2000'],
    'http_req_failed{scenario:homepage}': ['rate<0.01'],
    'http_req_duration{scenario:recipes}': ['p(95)<2000'],
    'http_req_failed{scenario:recipes}': ['rate<0.01'],
  },
};

function makeRegisterRequest() {
  const email = generateUniqueEmail();
  const password = email;
  const name = email;
  const url = `${baseUrl}/core-auth-bff/auth/register`;

  const payload = JSON.stringify({
    email: email,
    password: password,
    name: name,
  });

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json',
      Priority: 'u=0',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Referer: 'http://84.252.134.216/register',
    },
    tags: { scenario: 'register' },
  };

  const response = http.post(url, payload, params);

  if (response.status === 200 || response.status === 201) {
    const userData = { email, password, name };
    try {
      http.post(loggerUrl, JSON.stringify(userData), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '1s',
        tags: { scenario: 'register' },
      });
    } catch {
      // Ignore logger errors
    }
  }

  check(response, {
    'register status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
}

function makeLoginRequest() {
  const user = loginUsers[Math.floor(Math.random() * loginUsers.length)];
  const url = `${baseUrl}/core-auth-bff/auth/login`;

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
    name: user.name,
  });

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json',
      Priority: 'u=0',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Referer: 'http://84.252.134.216/login?from=%2F',
    },
    tags: { scenario: 'login' },
  };

  const response = http.post(url, payload, params);

  check(response, {
    'login status is 200': (r) => r.status === 200,
  });
}

function makeRecipesRequest() {
  const recipeId = randomIntBetween(1, 80);
  const rscValue = Math.random().toString(36).substring(7);
  const url = `${baseUrl}/recipes/${recipeId}?_rsc=${rscValue}`;

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      rsc: '1',
      'next-router-state-tree':
        '%5B%22%22%2C%7B%22children%22%3A%5B%22recipes%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22' +
        recipeId +
        '%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2C%22refetch%22%2Cfalse%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'next-url': '/',
      Priority: 'u=0',
      Referer: 'http://84.252.134.216/',
      Cookie: `auth_token=${authToken}`,
    },
    tags: { scenario: 'recipes' },
  };

  const response = http.get(url, params);

  check(response, {
    'recipes status is 200': (r) => r.status === 200,
  });
}

function makeHomepageRequest() {
  const url = `${baseUrl}/`;

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Upgrade-Insecure-Requests': '1',
      Priority: 'u=0, i',
      Referer: 'http://84.252.134.216/login?from=%2F',
      Cookie: `auth_token=${authToken}`,
    },
    tags: { scenario: 'homepage' },
  };

  const response = http.get(url, params);

  check(response, {
    'homepage status is 200': (r) => r.status === 200,
  });
}

export default function () {
  const scenarioName = exec.scenario.name;
  if (scenarioName === 'register') {
    makeRegisterRequest();
  } else if (scenarioName === 'login') {
    makeLoginRequest();
  } else if (scenarioName === 'recipes_random') {
    makeRecipesRequest();
  } else if (scenarioName === 'homepage') {
    makeHomepageRequest();
  }
}

export function handleSummary() {
  return {};
}
