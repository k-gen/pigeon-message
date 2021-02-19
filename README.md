<small style="text-align:right;display:block">[![GitHub stars](https://img.shields.io/github/stars/k-gen/pigeon-message)](https://github.com/k-gen/pigeon-message/stargazers) [![GitHub forks](https://img.shields.io/github/forks/k-gen/pigeon-message)](https://github.com/k-gen/pigeon-message/network) [![GitHub issues](https://img.shields.io/github/issues/k-gen/pigeon-message)](https://github.com/k-gen/pigeon-message/issues)</small>

# pigeon-message / 伝書鳩

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

---

# Whats this ? / これはなに？

指定した日時にメッセージを投稿してくれるSlackAppです。

投稿先のチャンネルや任意のユーザーへメンションも設定可能です。

JSX風にSlack block kitが書けるオープンソースライブラリ[jsx-slack](https://github.com/speee/jsx-slack)を利用しています。

# How to set up / 初期設定

## SlackAppをインストール
  https://api.slack.com/apps
  ![screenshot4](https://user-images.githubusercontent.com/46369030/108592623-1e05c680-73b2-11eb-9d9e-05abfb7da0a8.png)

## .envファイルに各種tokenを記載
### Settings > Basic Information > Signing Secret
  ![screenshot1](https://user-images.githubusercontent.com/46369030/108592090-7c7d7580-73af-11eb-9f0a-f722e0c9700d.png)
### Features > OAuth & Permissions > Bot User OAuth Access Token
  ![screenshot2](https://user-images.githubusercontent.com/46369030/108592338-c2870900-73b0-11eb-8cdc-dc2ab5480805.png)
### Socket Modeを有効化しSLACK_APP_TOKENを取得
  ![screenshot3](https://user-images.githubusercontent.com/46369030/108592438-35907f80-73b1-11eb-8239-9c836fd5c277.png)

## Appを起動

`npm start`

# How to use / 使い方

ショートカットから伝書鳩を呼び出して下さい
![screenshot5](https://user-images.githubusercontent.com/46369030/108593133-53f87a00-73b5-11eb-98e7-b77d5c93f0d7.png)

あとは送付先や日時を設定したら鳩があなたに代わってメッセージを送ってくれます
![screenshot6](https://user-images.githubusercontent.com/46369030/108593164-7a1e1a00-73b5-11eb-9d59-7ad8933337f9.png)

# Notes / 備考

以下の記事を参考に社内向けSlackAppとして開発中

[実践 jsx-slack: jsx-slack + Bolt で Slack のモーダルを自在に操ろう](https://tech.speee.jp/entry/2019/10/16/100022)