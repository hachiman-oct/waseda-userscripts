# Waseda Userscripts  
早稲田大学向けユーザースクリプト集  
Waseda University Custom Userscripts Collection

Tampermonkey などのユーザースクリプトマネージャで使えるスクリプトをまとめています。  
This repository provides userscripts for enhancing Waseda University's web services using Tampermonkey or similar tools.

---

## 📄 収録スクリプト / Available Scripts

### 1. [moodle-dlbtn.user.js](./moodle/moodle-dlbtn.user.js)
#### Moodle 資料一括ダウンロードボタン追加  
**Moodle Bulk Download Button for Resources**

- 対象ページ / Target: `https://wsdmoodle.waseda.jp/course/view.php`
- 講義資料（Resource）の未完了分を一括ダウンロード  
  Download all uncompleted resource files at once
- ダウンロード後に「完了」に自動チェック  
  Marks resources as completed after download

**インストールURL / Install URL:**

---

### 2. [syllabus_mobile.js](./syllabus/syllabus_mobile.js)
#### シラバスページのモバイル最適化  
**Responsive Mobile View for Waseda Syllabus**

- 対象ページ / Target: `https://www.wsl.waseda.jp/syllabus/*`
- 検索画面・結果画面・詳細ページをスマホ向けに最適化  
  Optimizes search, results, and detail pages for mobile use
- 不要な要素を非表示にしてスッキリ表示  
  Hides unnecessary elements for clean UI

**インストールURL / Install URL:**

---

## 🚀 導入方法 / How to Use

1. [Tampermonkey](https://www.tampermonkey.net/) をブラウザにインストール  
   Install Tampermonkey in your browser
2. 上記のインストールURLにアクセスし、スクリプトを追加  
   Open the install URL above and add the script
3. 対象のウェブサイトにアクセスすれば自動で動作します  
   The script will run automatically on the target site

---

## ⚠️ 注意事項 / Disclaimer

- 利用は自己責任でお願いします  
  Use at your own risk.
- スクリプトの仕様は予告なく変更されることがあります  
  Scripts may be updated without notice.
- 本スクリプト群は早稲田大学の公式とは無関係です  
  These scripts are unofficial and not affiliated with Waseda University.
- MITライセンスで公開されています  
  Licensed under the MIT License.

---

## 📝 ライセンス / License

[MIT License](./LICENSE)

---

## 👤 作者 / Author

- GitHub: [hachiman-oct](https://github.com/hachiman-oct)